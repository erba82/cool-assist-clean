import axios from 'axios';

// Define the base URL for the AI service
const API_URL = '/api';

// Create an axios instance for the AI service
const aiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interface for AI response
interface AIResponse {
  text: string;
  confidence: number;
  sources?: string[];
}

// AI service methods
export const aiService = {
  // Send a message to the AI service
  sendMessage: async (message: string): Promise<string> => {
    try {
      // In a production environment, this would call the actual AI backend
      // For now, we'll implement a more sophisticated simulation

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Process the message to determine the appropriate response
      const response = processMessage(message);

      // Log the interaction for debugging
      console.log('AI Interaction:', { message, response });

      return response.text;

      // Actual implementation would be:
      // const response = await aiClient.post('/chat', { message });
      // return response.data.reply;
    } catch (error) {
      console.error('Error sending message to AI service:', error);
      throw new Error('Failed to get response from AI service');
    }
  },

  // Get AI service status
  getStatus: async (): Promise<boolean> => {
    try {
      // Simulate status check
      return true;

      // Actual implementation would be:
      // const response = await aiClient.get('/status');
      // return response.data.online;
    } catch (error) {
      console.error('Error checking AI service status:', error);
      return false;
    }
  }
};

// Helper function to process messages and generate appropriate responses
function processMessage(message: string): AIResponse {
  // Convert message to lowercase for easier matching
  const lowerMessage = message.toLowerCase();

  // Check for greetings
  if (lowerMessage.includes('سلام') ||
    lowerMessage.includes('hello') ||
    lowerMessage.includes('hi') ||
    lowerMessage.includes('درود')) {
    return {
      text: 'Hi! I\'m COOL-ASSIST\'s smart assistant. How can I help you with HVACR and electrical?',
      confidence: 0.95
    };
  }

  // Check for refrigerant-related queries
  if (lowerMessage.includes('مبرد') ||
    lowerMessage.includes('refrigerant') ||
    lowerMessage.includes('r-') ||
    lowerMessage.includes('freon') ||
    lowerMessage.includes('کولانت') ||
    lowerMessage.includes('coolant')) {

    // Check for specific refrigerants
    if (lowerMessage.includes('r-22') || lowerMessage.includes('r22')) {
      return {
        text: 'R-22 or Freon 22 is an HCFC refrigerant whose use is decreasing due to its destructive effect on the ozone layer. This refrigerant has a GWP of about 1810 and an ODP of about 0.055. Its critical temperature is 96.2 °C and its critical pressure is 4980 kPa. For more information, you can refer to the refrigerant properties section.',
        confidence: 0.9,
        sources: ['ASHRAE Handbook', 'EPA Regulations']
      };
    }

    if (lowerMessage.includes('r-134a') || lowerMessage.includes('r134a')) {
      return {
        text: 'R-134a is an HFC refrigerant that is a common replacement for R-12. This refrigerant has a GWP of about 1430 and an ODP of zero. Its critical temperature is 101.1 °C and its critical pressure is 4060 kPa. For more information, you can refer to the Refrigerant Properties section.',
        confidence: 0.9,
        sources: ['ASHRAE Handbook']
      };
    }

    if (lowerMessage.includes('r-410a') || lowerMessage.includes('r410a') || lowerMessage.includes('puron')) {
      return {
        text: 'R-410A or Puron is an HFC refrigerant that is a common replacement for R-22 in home air conditioning systems. This refrigerant has a GWP of about 2088 and an ODP of zero. Its critical temperature is 72.8 °C and its critical pressure is 4926 kPa. For more information, you can refer to the Refrigerant Properties section.',
        confidence: 0.9,
        sources: ['ASHRAE Handbook']
      };
    }

    if (lowerMessage.includes('آمونیاک') || lowerMessage.includes('ammonia') || lowerMessage.includes('r-717') || lowerMessage.includes('r717')) {
      return {
        text: 'Ammonia (R-717) is a natural refrigerant used in large industrial and commercial systems. This refrigerant has zero GWP and zero ODP, but is toxic and flammable (safety class B2L). Its critical temperature is 132.3 °C and its critical pressure is 11333 kPa. For more information, you can refer to the section on refrigerant properties.',
        confidence: 0.9,
        sources: ['ASHRAE Handbook', 'IIAR Standards']
      };
    }

    // General refrigerant response
    return {
      text: 'For detailed information about refrigerants, you can refer to the Refrigerant Properties section. In this section, you can see the thermodynamic properties of various refrigerants, including natural refrigerants such as ammonia (R-717), carbon dioxide (R-744), and propane (R-290). Do you have a specific question about a particular refrigerant?',
      confidence: 0.85
    };
  }

  // Check for load calculation queries
  if (lowerMessage.includes('محاسبه بار') ||
    lowerMessage.includes('load calculation') ||
    lowerMessage.includes('cooling load') ||
    lowerMessage.includes('heating load') ||
    lowerMessage.includes('بار سرمایشی') ||
    lowerMessage.includes('بار گرمایشی')) {

    return {
      text: 'To calculate the cooling and heating load, you can refer to the Load Calculation section. In this section, two calculation methods will be available: the quick estimation method (rule of thumb) and the exact calculation method. This feature is under development and will be available soon.',
      confidence: 0.9
    };
  }

  // Check for diagram generator queries
  if (lowerMessage.includes('دیاگرام') ||
    lowerMessage.includes('diagram') ||
    lowerMessage.includes('schematic') ||
    lowerMessage.includes('نقشه')) {

    return {
      text: 'The diagram generation feature allows you to design and generate diagrams of air conditioning systems. This feature is under development and will be available soon.',
      confidence: 0.85
    };
  }

  // Check for project management queries
  if (lowerMessage.includes('مدیریت پروژه') ||
    lowerMessage.includes('project management') ||
    lowerMessage.includes('project') ||
    lowerMessage.includes('پروژه')) {

    return {
      text: 'The project management feature allows you to manage and track your HVACR projects. This feature will include scheduling, progress tracking, and system monitoring for designed projects. This feature is under development and will be available soon.',
      confidence: 0.85
    };
  }

  // Check for troubleshooting queries
  if (lowerMessage.includes('عیب‌یابی') ||
    lowerMessage.includes('troubleshooting') ||
    lowerMessage.includes('مشکل') ||
    lowerMessage.includes('خرابی') ||
    lowerMessage.includes('تعمیر')) {

    return {
      text: 'The diagnostics feature helps you diagnose and fix problems with your air conditioning systems. This feature is under development and will be available soon.',
      confidence: 0.85
    };
  }

  // Default response for unknown queries
  return {
    text: 'I understand your question. I am an HVACR and Electrical Intelligent Assistant. I can help you with refrigerants, load calculations, diagrams, project management, and troubleshooting. Please be more specific with your question so I can help you better.',
    confidence: 0.7
  };
}
