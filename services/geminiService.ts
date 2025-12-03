

import { GoogleGenAI, FunctionDeclaration, Type, GenerateContentResponse } from "@google/genai";

let ai: GoogleGenAI | null = null;
let initializationAttempted = false;

// This function lazily initializes the AI service in the most robust way possible.
export const getAiInstance = (): GoogleGenAI | null => {
    // If we've already tried to initialize, return the cached instance (or null if it failed).
    if (initializationAttempted) {
        return ai;
    }
    
    initializationAttempted = true;
    
    try {
        // This block attempts to access `process.env.API_KEY`. In browser environments
        // where `process` is not defined, this will throw a ReferenceError.
        const apiKey = process.env.API_KEY;
        
        if (apiKey) {
            ai = new GoogleGenAI({ apiKey });
        } else {
            console.warn("API_KEY is not configured. AI features are disabled.");
            ai = null;
        }
    } catch (error) {
        // The catch block will handle the ReferenceError gracefully, preventing an app crash.
        console.warn("`process.env` is not available in this environment. AI features are disabled.");
        ai = null;
    }
    
    return ai;
};


const model = 'gemini-2.5-flash';

const systemInstruction = `You are FinanZen AI, a helpful assistant for the FinanZen financial app. 
The app has the following sections: Dashboard (overview of finances), Transactions (log expenses and income), 
Bills (calendar for payment reminders), Profile (manage your user info), and Subscription. 
Your goal is to answer user questions about how to use these features. 
Be friendly and concise.
If you are asked something you cannot answer, or a question unrelated to the app's functionality, 
you MUST end your response with the special token \`[ESCALATE]\`.`;

export const getGeminiResponse = async (prompt: string): Promise<string> => {
  const aiClient = getAiInstance();
  if (!aiClient) {
    return "The AI assistant is currently unavailable. Please check the API key configuration.";
  }
  try {
    const response = await aiClient.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error getting response from Gemini:", error);
    return "Sorry, I'm having trouble connecting to the AI service right now.";
  }
};

// --- AI Manager Service ---

const addTransactionFunctionDeclaration: FunctionDeclaration = {
    name: 'addTransaction',
    description: 'Adiciona uma nova transação de despesa ou receita à conta do usuário.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: 'A descrição da transação. Ex: "Almoço no restaurante"' },
        amount: { type: Type.NUMBER, description: 'O valor da transação. Deve ser um número positivo.' },
        type: { type: Type.STRING, description: 'O tipo da transação, "expense" para despesa ou "income" para receita.' },
        category: { type: Type.STRING, description: 'A categoria da transação. Ex: "Alimentação", "Salário", "Lazer"' },
        date: { type: Type.STRING, description: 'A data da transação no formato AAAA-MM-DD.' },
        paymentMethod: { type: Type.STRING, description: 'O método de pagamento. Ex: "Cartão de Crédito", "PIX"' },
        accountId: { type: Type.NUMBER, description: 'O ID da conta à qual esta transação pertence.' },
        expenseType: { type: Type.STRING, description: 'Opcional. O tipo de despesa: "unique", "fixed", ou "installment". Default é "unique".' },
      },
      required: ['description', 'amount', 'type', 'category', 'date', 'paymentMethod', 'accountId'],
    },
};

const addAccountFunctionDeclaration: FunctionDeclaration = {
    name: 'addAccount',
    description: 'Cria uma nova conta financeira para o usuário.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'O nome da nova conta. Ex: "Conta Poupança", "Cartão de Crédito XP"' },
            description: { type: Type.STRING, description: 'Uma breve descrição da conta. Ex: "Para despesas da casa"' },
        },
        required: ['name', 'description'],
    },
};

const addBillFunctionDeclaration: FunctionDeclaration = {
    name: 'addBill',
    description: 'Adiciona uma nova conta a pagar para o usuário.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'O nome da conta a pagar. Ex: "Conta de Internet", "Aluguel"' },
            amount: { type: Type.NUMBER, description: 'O valor da conta.' },
            dueDate: { type: Type.STRING, description: 'A data de vencimento no formato AAAA-MM-DD.' },
            isRecurring: { type: Type.BOOLEAN, description: 'Se a conta é recorrente (se repete).' },
            recurrence: { type: Type.STRING, description: 'Se for recorrente, a frequência: "monthly" ou "yearly".' },
        },
        required: ['name', 'amount', 'dueDate'],
    },
};

const updateBillStatusFunctionDeclaration: FunctionDeclaration = {
    name: 'updateBillStatus',
    description: 'Atualiza o status de uma conta a pagar para paga ou não paga.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            billId: { type: Type.NUMBER, description: 'O ID da conta a pagar a ser atualizada. Você deve encontrar este ID no contexto fornecido.' },
            isPaid: { type: Type.BOOLEAN, description: 'O novo status. `true` para paga, `false` para não paga.' },
        },
        required: ['billId', 'isPaid'],
    },
};

const getTransactionReportFunctionDeclaration: FunctionDeclaration = {
    name: 'getTransactionReport',
    description: 'Busca e analisa as transações do usuário com base em filtros. Use esta função para responder a perguntas sobre gastos, receitas, categorias, etc.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            startDate: { type: Type.STRING, description: 'Opcional. A data de início do período no formato AAAA-MM-DD.' },
            endDate: { type: Type.STRING, description: 'Opcional. A data final do período no formato AAAA-MM-DD.' },
            type: { type: Type.STRING, description: 'Opcional. Filtra por tipo: "expense" ou "income".' },
            category: { type: Type.STRING, description: 'Opcional. Filtra por uma categoria específica.' },
            aggregation: { type: Type.STRING, description: 'Opcional. Tipo de cálculo a ser feito: "max" (encontra a maior transação), "sum" (soma os valores), "count" (conta as transações), "groupByCategory" (agrupa os gastos por categoria).' },
        },
        required: [],
    },
};

export const aiManagerTools: FunctionDeclaration[] = [
    addTransactionFunctionDeclaration,
    addAccountFunctionDeclaration,
    addBillFunctionDeclaration,
    updateBillStatusFunctionDeclaration,
    getTransactionReportFunctionDeclaration,
];

export const aiManagerSystemInstruction = `Você é o Gestor IA do FinanZen, um assistente financeiro especialista. Sua comunicação é clara, precisa e sempre em português do Brasil. A data atual é ${new Date().toLocaleDateString('pt-BR')}.

Você tem acesso ao contexto financeiro completo do usuário (transações, contas, contas a pagar) em formato JSON, que será fornecido a cada prompt.

Suas funções principais são:
1.  **Analisar Dados e Criar Relatórios:** Responda a perguntas sobre os dados financeiros. Você pode interpretar períodos relativos (ex: "último trimestre", "mês passado") e fazer cálculos. Para isso, você DEVE usar a ferramenta \`getTransactionReport\` para buscar os dados necessários. Depois de obter o resultado da ferramenta, formule uma resposta clara para o usuário.

2.  **Gerenciar Finanças com Ferramentas:** O usuário pode pedir para você realizar ações. Você DEVE usar as ferramentas disponíveis para isso. As ferramentas são:
    *   \`addTransaction\`: Para registrar despesas ou receitas.
    *   \`addAccount\`: Para criar novas contas financeiras.
    *   \`addBill\`: Para adicionar contas a pagar.
    *   \`updateBillStatus\`: Para marcar uma conta como paga ou não paga. Use o 'billId' do contexto.
    *   \`getTransactionReport\`: Para buscar e analisar dados de transações.

3.  **Autocorreção de Erros:** Se uma chamada de ferramenta (\`tool call\`) falhar, você receberá a mensagem de erro. Analise o erro, sua chamada de função original e o pedido do usuário. Em seguida, tente novamente com uma chamada de função corrigida. Se ainda não conseguir, peça esclarecimentos ao usuário.

4.  **Não Alucinar:** Responda apenas com base nos dados fornecidos no contexto ou obtidos através das ferramentas. Se faltar informação para usar uma ferramenta (ex: falta o \`accountId\` para \`addTransaction\`), peça ao usuário.

5.  **Regras de Segurança Estritas:**
    *   **Escopo do Usuário:** Você opera ESTRITAMENTE dentro do contexto do usuário logado. Todas as ações devem se referir APENAS aos dados do usuário fornecidos.
    *   **Proibição de Acesso a Outros Usuários:** Você NÃO PODE acessar, visualizar ou modificar dados de outros usuários.
    *   **Sem Privilégios de Administrador:** Você não possui funções de administrador. Não pode gerenciar usuários, assinaturas ou configurações do sistema.`;
    
// --- AI Admin Agent Service ---

const analyzeAndSuggestFixFunctionDeclaration: FunctionDeclaration = {
    name: 'analyzeAndSuggestFix',
    description: 'Analisa um item de feedback de usuário para identificar a causa raiz do problema e sugere um plano de ação ou uma correção de código simulada.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            feedbackId: { type: Type.NUMBER, description: 'O ID do item de feedback a ser analisado. Este ID deve ser obtido do contexto de feedback do usuário.' },
        },
        required: ['feedbackId'],
    },
};

export const aiAdminTools: FunctionDeclaration[] = [
    analyzeAndSuggestFixFunctionDeclaration,
];

export const aiAdminSystemInstruction = `Você é um Agente IA de Suporte Técnico para o aplicativo FinanZen. Seu papel é ajudar o administrador a manter o aplicativo funcionando corretamente, analisando problemas relatados pelos usuários e propondo soluções.

Suas funções principais são:
1.  **Analisar Feedback:** Quando o administrador pedir para analisar um problema, você DEVE usar a ferramenta \`analyzeAndSuggestFix\`, fornecendo o \`feedbackId\` do problema em questão. O contexto com os feedbacks dos usuários será fornecido em cada prompt.

2.  **Propor Soluções:** Após a ferramenta retornar uma análise, sua tarefa é formatar essa informação em uma resposta clara e útil para o administrador. A resposta deve incluir:
    *   **Diagnóstico:** Uma breve explicação do que você acredita ser a causa do problema.
    *   **Plano de Ação:** Passos claros que o administrador pode seguir.
    *   **Sugestão de Código (Simulada):** Se aplicável, forneça um bloco de código que ilustre a correção. Deixe claro que esta é uma simulação para fins de demonstração.

3.  **Ser Proativo:** Se você identificar um padrão em múltiplos feedbacks, aponte isso para o administrador.

4.  **Manter o Foco:** Responda apenas a perguntas relacionadas à manutenção do app, análise de feedback e suporte ao usuário. Não execute tarefas financeiras de usuários.`;
