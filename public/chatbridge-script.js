
// 🔧 CONFIGURATION - Updated with your n8n webhook endpoint
const WEBHOOK_URL = 'https://n8n-orangecarrot-u49460.vm.elestio.app/webhook/ffe6d5ca-015d-46b2-8645-9e24cbfd5def';

// DOM elements
const chatLog = document.getElementById('chatLog');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// Focus input on load
userInput.focus();

// Send message function
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // Clear input and disable send button
    userInput.value = '';
    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';
    
    // Add user message bubble
    addMessageBubble(message, 'user');
    
    // Add typing indicator
    const typingBubble = addMessageBubble('Thinking...', 'typing');
    
    try {
        console.log('Sending request to:', WEBHOOK_URL);
        console.log('Message:', message);
        
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 15000)
        );
        
        // Try POST first, then GET as fallback
        let response;
        try {
            // Try POST request first
            console.log('Trying POST request with JSON body:', { text: message });
            response = await Promise.race([
                fetch(WEBHOOK_URL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ text: message })
                }),
                timeoutPromise
            ]);
        } catch (postError) {
            console.log('POST failed, trying GET request');
            // Fallback to GET request
            const getUrl = `${WEBHOOK_URL}?text=${encodeURIComponent(message)}`;
            console.log('Trying GET request to:', getUrl);
            response = await Promise.race([
                fetch(getUrl, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Accept': 'application/json',
                    }
                }),
                timeoutPromise
            ]);
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received response:', data);
        
        // Remove typing indicator
        typingBubble.remove();
        
        // Add assistant response - extract 'message' field
        const reply = data.message || 'No message received';
        addMessageBubble(reply, 'assistant');
        
    } catch (error) {
        console.error('Error:', error);
        
        // Remove typing indicator
        typingBubble.remove();
        
        // Add error message
        let errorMessage = 'Sorry, something went wrong.';
        if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect. Please check your webhook URL.';
        } else if (error.message.includes('HTTP')) {
            errorMessage = `Server error: ${error.message}`;
        }
        
        addMessageBubble(errorMessage, 'error');
    } finally {
        // Re-enable send button
        sendButton.disabled = false;
        sendButton.textContent = 'Send';
        userInput.focus();
    }
}

// Add message bubble to chat
function addMessageBubble(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = `bubble ${type}`;
    bubbleDiv.textContent = text;
    
    messageDiv.appendChild(bubbleDiv);
    chatLog.appendChild(messageDiv);
    
    // Scroll to bottom
    chatLog.scrollTop = chatLog.scrollHeight;
    
    return messageDiv;
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

// Enter key handling with proper event prevention
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent any default behavior
        e.stopPropagation(); // Stop event bubbling
        if (!sendButton.disabled) {
            sendMessage();
        }
    }
});

console.log('ChatBridge initialized. Webhook URL:', WEBHOOK_URL);
console.log('Supports both GET and POST methods');
