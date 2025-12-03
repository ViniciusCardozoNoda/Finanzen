import React, { useState, useRef, useEffect } from 'react';
import { useLocalization } from '../../context/LocalizationContext';
import { getAiInstance, aiManagerSystemInstruction, aiManagerTools, aiAdminSystemInstruction, aiAdminTools } from '../../services/geminiService';
import { Message, ExpenseType, Transaction, FeedbackItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Chat } from '@google/genai';

const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLocalization();
  const { user } = useAuth();
  const { transactions, accounts, bills, addTransaction, addAccount, addBill, updateBillStatus, feedbackItems } = useData();
  const chatRef = useRef<Chat | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);
  
  useEffect(() => {
    if (isOpen && user) {
        const isUser = user.role === 'user';
        const welcomeMessage = isUser ? t('ai_manager_welcome') : 'Olá, admin. Estou pronto para ajudar a analisar o feedback dos usuários e a manter o aplicativo. O que você precisa?';
        setMessages([{ sender: 'ai', text: welcomeMessage }]);

        if (!chatRef.current) {
            const aiInstance = getAiInstance();
            if (aiInstance) {
                chatRef.current = aiInstance.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: isUser ? aiManagerSystemInstruction : aiAdminSystemInstruction,
                        tools: [{ functionDeclarations: isUser ? aiManagerTools : aiAdminTools }],
                    }
                });
            }
        }
    }
  }, [isOpen, t, user]);

  const executeFunctionCall = async (fc: any) => {
    if (!user) throw new Error("User not logged in.");
    
    const { name, args } = fc;

    // Robustness: Check for required arguments
    const requiredArgs: Record<string, string[]> = {
        addTransaction: ['description', 'amount', 'category', 'accountId'],
        addAccount: ['name', 'description'],
        addBill: ['name', 'amount', 'dueDate'],
        updateBillStatus: ['billId', 'isPaid'],
        analyzeAndSuggestFix: ['feedbackId']
    };

    if (requiredArgs[name]) {
        for (const arg of requiredArgs[name]) {
            if (args[arg] === undefined || args[arg] === null) {
                throw new Error(`Argumento ausente para ${name}: ${arg}`);
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
            await addAccount({ userId: user.id, name: args.name, description: args.description });
            setMessages(prev => [...prev, { sender: 'system', text: t('account_added_successfully') }]);
            return { success: true, message: t('account_added_successfully') };

        case 'addBill':
            await addBill({
                userId: user.id, name: args.name, amount: args.amount,
                dueDate: new Date(args.dueDate + 'T00:00:00'),
                isRecurring: args.isRecurring || false, recurrence: args.recurrence,
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
            if (args.type) filtered = filtered.filter(t => t.type === args.type);
            if (args.category) filtered = filtered.filter(t => t.category === args.category);

            if (args.aggregation) {
                if (filtered.length === 0) {
                    return { result: "Nenhuma transação encontrada.", value: 0 };
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
        case 'analyzeAndSuggestFix': {
            const feedback = feedbackItems.find(f => f.id === args.feedbackId);
            if (!feedback) {
                return { error: `Feedback com ID ${args.feedbackId} não encontrado.`};
            }
            // Simulate analysis
            return {
                analysis: `Análise do feedback ID ${feedback.id}: O usuário '${feedback.userName}' reportou um problema sobre '${feedback.message}'. Parece ser um erro de cálculo na lógica de agregação de dados do componente 'MonthlySummary'.`,
                actionPlan: '1. Verificar a função `useMemo` no arquivo `MonthlySummary.tsx`. 2. Filtrar as transações corretamente pelo mês e ano selecionados. 3. Garantir que a soma de despesas e receitas está correta.',
                simulatedCodeFix: "```javascript\n// Em MonthlySummary.tsx, a lógica do useMemo deve ser revisada:\nconst monthlyData = useMemo(() => {\n  // ...lógica de filtragem precisa ser verificada aqui\n}, [transactions, selectedDate]);\n```"
            };
        }
        default:
            throw new Error(`Unknown function call: ${name}`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = input;
    const chat = chatRef.current;
    if (!currentInput.trim() || isLoading || !user || !chat) return;
    
    const userMessage: Message = { sender: 'user', text: currentInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const context = user.role === 'user' 
            ? JSON.stringify({ transactions, accounts, bills }) 
            : JSON.stringify({ feedbackItems });

        const fullPrompt = `Contexto Atual:\n${context}\n\nSolicitação:\n${currentInput}`;

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
                    response: r.response 
                },
            }));

            response = await chat.sendMessage({ message: functionResponseParts });
        }

        if (response.text) {
            setMessages(prev => [...prev, { sender: 'ai', text: response.text }]);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setMessages(prev => [...prev, { sender: 'system', text: errorMessage }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl hover:from-indigo-600 hover:to-cyan-600 transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-400 z-50"
        aria-label={t('ai_assistant')}
      >
        <i className="fas fa-brain"></i>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full sm:w-96 h-[70vh] sm:h-[60vh] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl flex flex-col z-40 animate-fade-in">
          <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-700 rounded-t-lg">
            <h3 className="text-lg font-semibold text-white">{t('ai_assistant')}</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((msg, index) => {
              if (msg.sender === 'system') {
                return (
                  <div key={index} className="text-center text-sm text-slate-400 my-2 italic animate-fade-in">
                    {msg.text}
                  </div>
                );
              }
              return (
                <div key={index} className={`flex mb-4 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg p-3 max-w-xs lg:max-w-md ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            {isLoading && (
                 <div className="flex justify-start mb-4 animate-fade-in">
                    <div className="bg-slate-700 text-slate-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700 bg-slate-900 rounded-b-lg">
            <div className="flex items-center bg-slate-700 rounded-lg">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('type_your_message')}
                className="w-full bg-transparent p-3 text-white placeholder-slate-400 focus:outline-none"
                disabled={isLoading}
              />
              <button type="submit" className="p-3 text-indigo-400 hover:text-indigo-300 disabled:text-slate-500" disabled={isLoading || !input.trim()}>
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;