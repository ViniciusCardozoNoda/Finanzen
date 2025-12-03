
import React, { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getAiInstance, aiManagerSystemInstruction, aiManagerTools } from '../services/geminiService';
import { ExpenseType, Transaction, View } from '../types';
import { Chat } from '@google/genai';

interface ChatMessage {
    sender: 'user' | 'ai' | 'system';
    text: string;
}

interface MessageContentProps {
    message: ChatMessage;
}

const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
    const baseClasses = "p-4 rounded-lg max-w-xl animate-fade-in";
    let content;

    switch(message.sender) {
        case 'user':
            content = <div className={`${baseClasses} bg-emerald-500 text-white self-end`}>{message.text}</div>;
            break;
        case 'ai':
            content = (
                 <div className={`${baseClasses} bg-white border border-slate-200 text-slate-800 self-start flex items-start space-x-3`}>
                     <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-brain text-slate-500"></i>
                     </div>
                    <div className="whitespace-pre-wrap">{message.text}</div>
                </div>
            );
            break;
        case 'system':
            content = (
                <div className="text-center text-sm text-slate-500 my-2 italic animate-fade-in">
                    {message.text}
                </div>
            );
            break;
        default:
            content = null;
    }
    return content;
};

interface AIManagerProps {
    setCurrentView: (view: View) => void;
}

const AIManager: React.FC<AIManagerProps> = ({ setCurrentView }) => {
    const { t } = useLocalization();
    const { user } = useAuth();
    const { transactions, accounts, bills, addTransaction, addAccount, addBill, updateBillStatus } = useData();
    const chatRef = useRef<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chatRef.current) {
            const aiInstance = getAiInstance();
            if (aiInstance) {
                chatRef.current = aiInstance.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: aiManagerSystemInstruction,
                        tools: [{ functionDeclarations: aiManagerTools }],
                    }
                });
            }
        }
        setMessages([{ sender: 'ai', text: t('ai_manager_welcome') }]);
    }, [t]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);
    
    const executeFunctionCall = async (fc: any) => {
        if (!user) throw new Error("User not logged in.");
        
        const { name, args } = fc;
        
        // Robustness: Check for required arguments to prevent runtime errors
        const requiredArgs: Record<string, string[]> = {
            addTransaction: ['description', 'amount', 'category', 'accountId'],
            addAccount: ['name', 'description'],
            addBill: ['name', 'amount', 'dueDate'],
            updateBillStatus: ['billId', 'isPaid'],
        };

        if (requiredArgs[name]) {
            for (const arg of requiredArgs[name]) {
                if (args[arg] === undefined || args[arg] === null) {
                    throw new Error(`Argumento ausente para ${name}: ${arg}. Peça ao usuário para fornecer.`);
                }
            }
        }


        switch (name) {
            case 'addTransaction':
                await addTransaction({
                    userId: user.id,
                    accountId: args.accountId,
                    description: args.description,
                    amount: args.amount,
                    type: args.type || 'expense',
                    date: new Date((args.date || new Date().toISOString().split('T')[0]) + 'T00:00:00'),
                    category: args.category,
                    paymentMethod: args.paymentMethod || 'Não especificado',
                    expenseType: args.expenseType as ExpenseType || 'unique',
                });
                 setMessages(prev => [...prev, { sender: 'system', text: t('transaction_added_dashboard_updated') }]);
                 return { success: true, message: t('transaction_added_dashboard_updated') };

            case 'addAccount':
                await addAccount({
                    userId: user.id,
                    name: args.name,
                    description: args.description,
                });
                setMessages(prev => [...prev, { sender: 'system', text: t('account_added_successfully') }]);
                return { success: true, message: t('account_added_successfully') };

            case 'addBill':
                await addBill({
                    userId: user.id,
                    name: args.name,
                    amount: args.amount,
                    dueDate: new Date(args.dueDate + 'T00:00:00'),
                    isRecurring: args.isRecurring || false,
                    recurrence: args.recurrence,
                });
                setMessages(prev => [...prev, { sender: 'system', text: t('bill_added_successfully') }]);
                return { success: true, message: t('bill_added_successfully') };

            case 'updateBillStatus':
                await updateBillStatus(args.billId, args.isPaid);
                setMessages(prev => [...prev, { sender: 'system', text: t('bill_status_updated_successfully') }]);
                return { success: true, message: t('bill_status_updated_successfully') };
            
            case 'getTransactionReport': {
                let filtered = [...transactions];
                if (args.startDate) {
                    const startDate = new Date(args.startDate + 'T00:00:00');
                    filtered = filtered.filter(t => t.date >= startDate);
                }
                if (args.endDate) {
                    const endDate = new Date(args.endDate + 'T00:00:00');
                    filtered = filtered.filter(t => t.date <= endDate);
                }
                if (args.type) {
                    filtered = filtered.filter(t => t.type === args.type);
                }
                if (args.category) {
                    filtered = filtered.filter(t => t.category === args.category);
                }

                if (args.aggregation) {
                    if (filtered.length === 0) {
                        return { result: "Nenhuma transação encontrada para os critérios fornecidos.", value: 0 };
                    }

                    switch (args.aggregation) {
                        case 'max': {
                            const maxTx = filtered.reduce((p, c) => ((Number(p.amount) || 0) > (Number(c.amount) || 0)) ? p : c);
                            return { 
                                aggregation: 'max', 
                                value: maxTx.amount, 
                                transaction: maxTx
                            };
                        }
                        case 'sum': {
                            const sum = filtered.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
                            return { aggregation: 'sum', value: sum };
                        }
                        case 'count': {
                            return { aggregation: 'count', value: filtered.length };
                        }
                        case 'groupByCategory': {
                            const categoryMap = filtered.reduce((acc, curr) => {
                                acc[curr.category] = (acc[curr.category] || 0) + (Number(curr.amount) || 0);
                                return acc;
                            }, {} as Record<string, number>);
                            return { aggregation: 'groupByCategory', value: categoryMap };
                        }
                        default:
                            return { error: `Agregação desconhecida: ${args.aggregation}` };
                    }
                }
                return { transactions: filtered };
            }

            default:
                throw new Error(`Unknown function call: ${name}`);
        }
    };

    const handleSendMessage = async (prompt: string) => {
        const chat = chatRef.current;
        if (!prompt.trim() || isLoading || !chat) return;

        const userMessage: ChatMessage = { sender: 'user', text: prompt };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const financialContext = JSON.stringify({ transactions, accounts, bills });
            const fullPrompt = `Contexto Financeiro Atual:\n${financialContext}\n\nSolicitação do Usuário:\n${prompt}`;

            let response = await chat.sendMessage({ message: fullPrompt });

            while (response.functionCalls) {
                const results = [];
                for (const fc of response.functionCalls) {
                     try {
                        const result = await executeFunctionCall(fc);
                        results.push({
                            id: fc.id,
                            name: fc.name,
                            response: result,
                        });
                    } catch (error) {
                         const errorMessage = error instanceof Error ? error.message : "An unknown error occurred executing the function.";
                         console.error("Function call failed:", errorMessage);
                         results.push({
                            id: fc.id,
                            name: fc.name,
                            response: { error: errorMessage },
                         });
                    }
                }
                const functionResponseParts = results.map((r) => ({
                    functionResponse: {
                      id: r.id,
                      name: r.name,
                      response: r.response,
                    },
                }));
                response = await chat.sendMessage({ message: functionResponseParts });
            }

            if (response.text) {
                setMessages(prev => [...prev, { sender: 'ai', text: response.text }]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            setMessages(prev => [...prev, { sender: 'system', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="h-full flex flex-col animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">{t('ai_manager')}</h1>
                <p className="text-slate-500 mt-1">{t('ai_manager_description')}</p>
            </div>
            
            <div className="flex-1 bg-slate-100 rounded-lg p-4 overflow-y-auto flex flex-col space-y-4">
                {messages.map((msg, index) => (
                    <MessageContent key={index} message={msg} />
                ))}

                 {isLoading && (
                     <div className="bg-white border border-slate-200 text-slate-800 self-start p-4 rounded-lg flex items-start space-x-3 animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                             <i className="fas fa-brain text-slate-500"></i>
                         </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="mt-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('type_your_request')}
                        disabled={isLoading}
                        className="w-full bg-white border border-slate-300 p-4 pr-16 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 disabled:bg-slate-300 transition-colors"
                    >
                       <i className="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIManager;
