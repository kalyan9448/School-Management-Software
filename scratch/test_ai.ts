import { aiService } from './src/services/aiService';

async function testChat() {
    try {
        console.log('Testing chatTopic...');
        const response = await aiService.chatTopic(
            'Math', 
            'Numbers', 
            [{role: 'assistant', content: 'Hi'}], 
            'What are numbers?',
            'Grade 10',
            ['CBSE']
        );
        console.log('Response:', response);
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testChat();
