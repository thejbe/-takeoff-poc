// Global state
let currentTab = 'passenger';
let conversationState = {
    hasProfile: false,
    userName: '',
    accessibilityNeeds: [],
    currentFlight: null,
    isVoiceActive: false,
    journeyStage: 'entry_via_airline',
    lastOptions: null,
    waitingForNumericInput: false,
    waitingForAttachmentChoice: false,
    processingNumericInput: false,
    confirmedTravel: false,
    preFlightStep: null,
    waitingForPreFlightOption: false,
    preFlightReminderScheduled: false,
    autoProgressTimeout: null,
    onFlightStep: null,
    feedbackStep: null,
    feedbackRatings: {},
    feedbackComments: {},
    currentRatingStage: null
};

// Sample data for demonstration (airport dashboard)
const samplePassengers = [
    {
        id: 1,
        name: 'Sarah Johnson',
        flight: 'BA 123',
        destination: 'JFK',
        gate: 'B7',
        departure: '14:30',
        needs: ['Wheelchair', 'Priority Boarding'],
        status: 'confirmed',
        hasNewMessage: true,
        meetingLocation: 'Assistance Desk',
        waitingPreference: 'Wagamama (restaurant)',
        phone: '+44 7123 456789',
        airlineStatus: 'waiting' // waiting somewhere airside
    },
    {
        id: 2,
        name: 'Michael Chen',
        flight: 'VS 456',
        destination: 'LAX',
        gate: 'A12',
        departure: '16:45',
        needs: ['Visual Impairment', 'Guide Dog'],
        status: 'awaiting',
        meetingLocation: 'Terminal 2 Disabled Parking',
        waitingPreference: 'Quiet Area (relaxation pods)',
        phone: '+44 7987 654321',
        airlineStatus: 'pre_security'
    },
    {
        id: 3,
        name: 'Amelia Clarke',
        flight: 'DL 44',
        destination: 'ATL',
        gate: 'C3',
        departure: '15:20',
        needs: ['Own Wheelchair', 'Transfer assistance'],
        status: 'no-show',
        meetingLocation: 'Heathrow Express Terminal',
        waitingPreference: 'Straight to Gate',
        phone: '+44 7900 111222',
        airlineStatus: 'no_show'
    },
    {
        id: 4,
        name: 'Luis Fernández',
        flight: 'AA 101',
        destination: 'DFW',
        gate: 'D8',
        departure: '17:10',
        needs: ['Hearing Support', 'Written announcements'],
        status: 'awaiting',
        meetingLocation: 'Terminal 2 Drop Off Zone',
        waitingPreference: 'Gordon Ramsay Plane Food (bar)',
        phone: '+44 7912 333444',
        airlineStatus: 'waiting'
    },
    {
        id: 5,
        name: 'Greta Müller',
        flight: 'LH 907',
        destination: 'FRA',
        gate: 'E2',
        departure: '18:05',
        needs: ['Cognitive support', 'Escort through security'],
        status: 'confirmed',
        meetingLocation: 'Assistance Desk',
        waitingPreference: 'Standard Assistance Area',
        phone: '+49 160 5556667',
        airlineStatus: 'boarded'
    },
    {
        id: 6,
        name: 'Nina Patel',
        flight: 'BA 789',
        destination: 'JFK',
        gate: 'B9',
        departure: '18:20',
        needs: ['Mobility assistance', 'Aisle chair'],
        status: 'awaiting',
        meetingLocation: 'Terminal 2 Disabled Parking',
        waitingPreference: 'Caffè Nero (coffee & light meals)',
        phone: '+44 7700 900123',
        airlineStatus: 'waiting'
    }
];

// Tab switching functionality
function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    // Update active tab panel
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    currentTab = tabName;
    
    // Set focus to message input if switching to passenger chat
    if (tabName === 'passenger') {
        setTimeout(() => {
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.focus();
            }
        }, 100); // Small delay to ensure tab switch is complete
    } else if (tabName === 'airport') {
        // Ensure airport subviews render when opening the tab
        setTimeout(() => {
            refreshAirportDashboardSummary();
            renderMeetingView();
            renderAirsideView();
            // Default to meeting view active
            switchAirportView('meeting');
        }, 50);
    }
    else if (tabName === 'airline') {
        setTimeout(() => {
            renderAirlineBoarding();
            renderAirlineCabin();
            renderAirlineMgmt();
            renderAirlineFeedback();
            switchAirlineView('boarding');
        }, 50);
    }
}

// Chat functionality
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    // Add user message to chat
    addMessage(message, 'user');
    input.value = '';
    
    // Keep focus on input for continued conversation
    input.focus();
    
    // Simulate AI response
    setTimeout(() => {
        const response = generateAIResponse(message);
        addMessage(response, 'bot');
        // Re-focus input after bot response
        setTimeout(() => {
            input.focus();
        }, 100);
    }, 1000);
}

function addMessage(content, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Format numbered options if content contains them
    const formattedContent = formatNumberedOptions(content);
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${formattedContent}
        </div>
        <div class="message-time">${timeString}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format content with numbered options
function formatNumberedOptions(content) {
    // Don't format summaries or information messages - only format actual option lists
    if (content.includes('Information for Heathrow') || 
        content.includes('Information for British Airways') || 
        content.includes('What happens next') ||
        content.includes('Perfect! I have everything for') ||
        content.includes("Here's what Mark looks like") ||
        content.includes('Pre-boarding brief') ||
        content.includes("Here's what the cabin crew know") ||
        content.includes('Your Complete Feedback Summary') ||
        content.includes('Your Feedback Has Been Shared')) {
        return content.split('\n').map(line => line.trim() === '' ? '<br>' : `<p>${processMarkdown(line)}</p>`).join('');
    }
    
    // Check if content already contains numbered options (1., 2., etc.) AND it's an actual option list
    if ((content.includes('\n1.') || content.includes('\n2.')) && content.includes('Just send me the number')) {
        // Split into lines and format each numbered option
        const lines = content.split('\n');
        let formattedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check if this line starts with a number (e.g., "1.", "2.", etc.)
            if (/^\d+\.\s/.test(line)) {
                formattedLines.push(`<div class="numbered-option">${processMarkdown(line)}</div>`);
            } else if (line === '') {
                formattedLines.push('<br>');
            } else {
                formattedLines.push(`<p>${processMarkdown(line)}</p>`);
            }
        }
        
        return formattedLines.join('');
    }
    
    // Check if content contains bullet points that should be numbered
    if (content.includes('•')) {
        // Convert bullet points to numbered options
        const lines = content.split('\n');
        let inOptionsSection = false;
        let optionNumber = 1;
        let formattedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check if this line starts with a bullet point
            if (line.startsWith('•')) {
                if (!inOptionsSection) {
                    inOptionsSection = true;
                    optionNumber = 1;
                }
                const optionText = line.substring(1).trim();
                formattedLines.push(`<div class="numbered-option">${optionNumber}. ${optionText}</div>`);
                optionNumber++;
            } else if (line === '' && inOptionsSection) {
                // Empty line after options - keep it but end options section
                formattedLines.push('<br>');
                inOptionsSection = false;
                optionNumber = 1;
            } else {
                // Regular line
                if (inOptionsSection && line !== '') {
                    inOptionsSection = false;
                    optionNumber = 1;
                }
                formattedLines.push(line === '' ? '<br>' : `<p>${processMarkdown(line)}</p>`);
            }
        }
        
        return formattedLines.join('');
    }
    
    // Default: just wrap in paragraph tags, preserving line breaks, and process markdown
    return content.split('\n').map(line => line.trim() === '' ? '<br>' : `<p>${processMarkdown(line)}</p>`).join('');
}

// Simple markdown processor for common formatting
function processMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
        .replace(/`(.*?)`/g, '<code>$1</code>'); // Inline code
}

// Helper function to create numbered options message
function createOptionsMessage(text, options) {
    conversationState.lastOptions = options;
    conversationState.waitingForNumericInput = true;
    
    let message = text + '\n\n';
    options.forEach((option, index) => {
        message += `${index + 1}. ${option}\n`;
    });
    
    message += '\nJust send me the number that works best for you! 😊';
    return message;
}

// Process numeric input for option selection
function processNumericInput(userMessage, currentContext) {
    const trimmed = userMessage.trim();
    const number = parseInt(trimmed);
    
    // Debug logging
    console.log('processNumericInput - input:', userMessage);
    console.log('processNumericInput - number:', number);
    console.log('processNumericInput - lastOptions:', conversationState.lastOptions);
    console.log('processNumericInput - waitingForNumericInput:', conversationState.waitingForNumericInput);
    
    // Check if input is a valid number and we're waiting for numeric input
    if (!isNaN(number) && number > 0 && conversationState.waitingForNumericInput) {
        // Store the last set of options for reference
        if (conversationState.lastOptions && number <= conversationState.lastOptions.length) {
            const selectedOption = conversationState.lastOptions[number - 1];
            console.log('processNumericInput - selected option:', selectedOption);
            return selectedOption;
        }
    }
    
    return null;
}

function generateAIResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Check if user provided a numeric response (but avoid infinite recursion)
    if (!conversationState.processingNumericInput && conversationState.waitingForNumericInput) {
        const numericSelection = processNumericInput(userMessage, conversationState);
        if (numericSelection) {
            console.log('Numeric selection found:', numericSelection);
            // Process the selected option as if user typed it
            conversationState.processingNumericInput = true;
            const response = generateAIResponse(numericSelection);
            conversationState.processingNumericInput = false;
            return response;
        }
    }
    
    // Get contextual response based on journey stage
    const stageContext = getStageContext(conversationState.journeyStage);
    
    // Handle assistance customization questions for airline route
    if (conversationState.journeyStage === 'entry_via_airline' && conversationState.assistanceStep) {
        console.log('Calling handleAssistanceQuestions with step:', conversationState.assistanceStep);
        console.log('User message:', userMessage);
        return handleAssistanceQuestions(message, userMessage);
    }
    
    // Handle attachment choice responses
    if (conversationState.waitingForAttachmentChoice) {
        const numericChoice = processNumericInput(userMessage, conversationState);
        const selectedChoice = numericChoice || userMessage;
        handleAttachmentChoice(selectedChoice);
        
        // Don't show "Processing your choice..." for location sharing in departure airport
        if ((selectedChoice.includes('location') || selectedChoice.includes('share')) && 
            conversationState.journeyStage === 'departure_airport' && 
            conversationState.departureAirportStep === 'location_sharing') {
            return ""; // No immediate response, the handleAttachmentChoice will handle it
        }
        
        return "Processing your choice...";
    }
    
    // Handle meeting location responses
    if (conversationState.journeyStage === 'entry_via_airline' && conversationState.waitingForMeetingLocation) {
        conversationState.waitingForMeetingLocation = false;
        conversationState.assistanceStep = 'check_in';
        conversationState.waitingForNumericInput = false;
        
        // If numeric input, get the actual location from lastOptions
        let selectedLocation = userMessage;
        const numericChoice = processNumericInput(userMessage, conversationState);
        if (numericChoice) {
            selectedLocation = numericChoice;
        }
        
        conversationState.meetingLocation = selectedLocation;
        
        return "Perfect! Now let's figure out exactly what help you need. Would you like assistance with check-in? (Many people prefer to do this themselves, especially when traveling with family)";
    }
    
    // Handle options question response for airline route
    if (conversationState.journeyStage === 'entry_via_airline' && conversationState.waitingForOptionsResponse) {
        conversationState.waitingForOptionsResponse = false;
        if (message.includes('yes') || message.includes('see') || message.includes('options') || message.includes('other')) {
            // Build and return the meeting location options immediately (no delayed send)
            const meetingOptions = [
                'Assistance Desk',
                'Terminal 2 Disabled Parking', 
                'Heathrow Express Terminal',
                'Terminal 2 Drop Off Zone'
            ];
            conversationState.waitingForMeetingLocation = true;
            return createOptionsMessage("Great! Here are the meeting point options. Where would work best for you?", meetingOptions);
        } else {
            // They want standard service
            conversationState.meetingLocation = 'Assistance Desk';
            conversationState.assistanceStep = 'check_in';
            return "Perfect! We'll use the standard service. You'll meet the team at the Assistance Desk and they'll help you to your gate. Now let's figure out what support you need. Would you like help with check-in? (Many people prefer to do this themselves, especially with family)";
        }
    }
    
    // Handle airline route confirmation responses
    if (conversationState.journeyStage === 'entry_via_airline') {
        if (message.includes('yes') || message.includes('correct') || message.includes('right') || message.includes('that\'s right')) {
            // Send the first message and wait for response
            conversationState.waitingForOptionsResponse = true;
            setTimeout(() => {
                addMessage("Usually we meet passengers at the Assistance Desk and help them to their gate. But we can do things differently if you'd prefer! Would you like to see your options?", 'bot');
            }, 1000);
            
            return "Perfect! I'll ask a few quick questions about what help you need, then share this with the Heathrow team so they can take great care of you.";
        }
        
        if (message.includes('no') || message.includes('wrong') || message.includes('incorrect') || message.includes('not right')) {
            // Move to request assistance stage
            setTimeout(() => {
                conversationState.journeyStage = 'request_assistance';
                // Update the radio button selection
                const radioButton = document.querySelector('input[value="request_assistance"]');
                if (radioButton) radioButton.checked = true;
            }, 100);
            return "OK, let's correct those details and move to request assistance.";
        }
    }
    
    // Profile setup responses
    if (message.includes('profile') || message.includes('setup') || message.includes('accessibility')) {
        if (!conversationState.hasProfile) {
            conversationState.hasProfile = true;
            return stageContext.profileSetup || "Great! Let's set up your accessibility profile. What's your name, and what assistance do you typically need when traveling? For example: wheelchair assistance, priority boarding, visual or hearing support, etc.";
        } else {
            return getProfileAwareResponse();
        }
    }
    
    // Name capture (but not during after_journey feedback flow)
    if ((message.includes('my name is') || message.includes("i'm ")) && 
        !(conversationState.journeyStage === 'after_journey' && conversationState.feedbackStep)) {
        const nameMatch = message.match(/(?:my name is|i'm|i am)\s+([a-zA-Z\s]+)/);
        if (nameMatch) {
            conversationState.userName = nameMatch[1].trim();
            updatePassengerData();
            return `Nice to meet you, ${conversationState.userName}! I've saved your name to your profile. What accessibility needs should I note for your travels?`;
        }
    }
    
    // Accessibility needs
    if (message.includes('wheelchair') || message.includes('mobility')) {
        conversationState.accessibilityNeeds.push('Wheelchair assistance');
        updatePassengerData();
        return "I've noted that you need wheelchair assistance. I'll make sure airports and airlines are prepared for your arrival. Do you have any other accessibility needs?";
    }
    
    if (message.includes('visual') || message.includes('blind') || message.includes('sight')) {
        conversationState.accessibilityNeeds.push('Visual assistance');
        updatePassengerData();
        return "I've added visual assistance to your profile. This will help ensure you receive proper guidance and support. Any other needs I should know about?";
    }
    
    if (message.includes('hearing') || message.includes('deaf')) {
        conversationState.accessibilityNeeds.push('Hearing support');
        updatePassengerData();
        return "I've noted your hearing support needs. I'll ensure all communications are accessible to you. Is there anything else I should add to your profile?";
    }
    
    // Departure Airport arrival flow
    if (conversationState.journeyStage === 'departure_airport') {
        if (message.includes("i've arrived") || message.includes("i have arrived") || message.includes("arrived")) {
            conversationState.departureAirportStep = 'show_mark_details';
            
            // Send Mark's photo and details after initial message
            setTimeout(() => {
                addMessage("📸 Here's what Mark looks like:\n\n<img src=\"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face\" alt=\"Mark\" style=\"width: 200px; height: 200px; border-radius: 10px; margin: 10px 0;\">\n\n👕 Mark will be wearing:\n• British Airways high-vis vest\n• Navy blue polo shirt\n• BA name badge\n• Black trousers\n\nHe'll be looking for you and will introduce himself when he approaches.", 'bot');
                
                setTimeout(() => {
                    addMessage("Could you share your location or parking space number to help Mark find you quickly?", 'bot');
                    conversationState.departureAirportStep = 'location_sharing';
                }, 2000);
            }, 1500);
            
            return "Great! Mark will be there in about 10 minutes and will bring someone to take your bags.";
        }
        
        if (conversationState.departureAirportStep === 'location_sharing') {
            if (message.includes('yes') || message.includes('sure') || message.includes('ok') || message.includes('location') || message.includes('space') || /\d/.test(message)) {
                conversationState.departureAirportStep = 'luggage_help';
                
                // Send confirmation that Mark is on his way
                setTimeout(() => {
                    addMessage("Mark is on his way to you now! 🚶‍♂️", 'bot');
                    
                    setTimeout(() => {
                        addMessage("For now you'll be messaging with Mark directly. If you need emergency help, type 'help' and we'll notify a supervisor at Heathrow.", 'bot');
                        
                        setTimeout(() => {
                            addMessage("Quick question - do you need Mark to bring someone to help with your luggage? Don't worry, they'll take it straight out of your car for you.", 'bot');
                        }, 2000);
                    }, 1500);
                }, 1000);
                
                // Simulate WhatsApp location sharing if they said "location"
                if (message.includes('location')) {
                    // Simulate user sending location
                    setTimeout(() => {
                        addMessage("📍 Location shared\n\nHeathrow Terminal 2 - Short Stay Car Park 2\nLevel 2, Space 47\n\n[Live location for 15 minutes]", 'user');
                    }, 500);
                    return "Great! Please share your location.";
                } else {
                    // They provided parking space number or said yes
                    return "Perfect! I've got your details and shared them with Mark.";
                }
            } else {
                conversationState.departureAirportStep = 'luggage_help';
                
                // Send confirmation that Mark is on his way
                setTimeout(() => {
                    addMessage("Mark is on his way to you now! 🚶‍♂️", 'bot');
                    
                    setTimeout(() => {
                        addMessage("For now you'll be messaging with Mark directly. If you need emergency help, type 'help' and we'll notify a supervisor at Heathrow.", 'bot');
                        
                        setTimeout(() => {
                            addMessage("Quick question - do you need Mark to bring someone to help with your luggage? Don't worry, they'll take it straight out of your car for you.", 'bot');
                        }, 2000);
                    }, 1500);
                }, 1000);
                
                return "No problem! Mark will find you at the disabled parking area. He's very experienced at locating passengers there.";
            }
        }
        
        if (conversationState.departureAirportStep === 'luggage_help') {
            conversationState.departureAirportStep = 'handover';
            
            let luggageResponse = "";
            if (message.includes('yes') || message.includes('need') || message.includes('help')) {
                luggageResponse = "Perfect! Mark will bring a colleague to help with your luggage. They'll handle everything from your car.";
            } else {
                luggageResponse = "Got it! Mark can handle your luggage himself - no problem.";
            }
            
            // Send handover message after luggage response
            setTimeout(() => {
                addMessage("🔄 Important: From now on, you'll be talking to Mark directly via this number. He'll take great care of you through the rest of your journey.\n\n🆘 If at any time you need emergency assistance, just type 'help' and a supervisor will be immediately alerted.\n\nMark should be with you any moment now! 😊", 'bot');
                conversationState.departureAirportStep = null; // Reset the flow
            }, 2000);
            
            return luggageResponse;
        }
        
        // If no specific flow is active and user hasn't said "I've arrived", don't respond with default messages
        // This keeps the stage silent until they say "I've arrived"
        return "I'm here when you need me! Let me know when you've arrived and I'll connect you with Mark.";
    }
    
    // Pre-flight flow: Passenger is waiting at chosen location before boarding
    if (conversationState.journeyStage === 'pre_flight') {
        // Initialize flow on first contact in this stage
        if (!conversationState.preFlightStep) {
            conversationState.preFlightStep = 'complete';
            
            // Schedule the messages directly without the helper function
            setTimeout(() => {
                console.log('Sending pre-board brief...');
                const meetInfo = getPreFlightMeetInfo();
                addMessage(`Pre-boarding brief:

• Meet time: ${meetInfo.meetTime}
• Walk time to gate: ${meetInfo.walkMinutes} minutes
• If anything changes, just message "help" and I'll update the team

I'll be here if you need me — enjoy your time and I'll prompt you when it's time to go.`, 'bot');
            }, 1000);
            
            setTimeout(() => {
                console.log('Sending time passes message...');
                addMessage('(time passes...)', 'bot');
            }, 1200);
            
            setTimeout(() => {
                console.log('Sending reminder message...');
                const info = getPreFlightMeetInfo();
                const meetingPlace = conversationState.meetingLocation || 'the Assistance Desk';
                addMessage(`⏳ Reminder: Mark will come to meet you in 15 minutes at ${meetingPlace} (${info.meetTime}). Please settle your bill and be ready. If you need help, type "help".`, 'bot');
            }, 1400);
            
            return `Thanks! I've got you checked in at your chosen waiting spot. 🍽️ Enjoy your time before boarding!

If you need help while you're waiting, you can:
1. Type "help" here and I'll notify the team
2. Ask the venue staff to call the Assistance Desk
3. Share your location and I'll arrange someone to meet you`;
        }



        // Handle numeric choice for quick contact
        if (conversationState.preFlightStep === 'final_pre_board') {
            // Cancel auto-progress timeout since user responded
            if (conversationState.autoProgressTimeout) {
                clearTimeout(conversationState.autoProgressTimeout);
                conversationState.autoProgressTimeout = null;
            }
            
            const choice = processNumericInput(userMessage, conversationState);
            if (choice) {
                if (choice.toLowerCase().includes('assistance desk')) {
                    // Still send the brief and reminder after showing contact info
                    setTimeout(() => sendPreBoardBriefAndReminder(), 1000);
                    return `📞 Assistance Desk — Terminal 2
• Phone: +44 20 8745 1234
• Location: Departures, near Zone A

If you need, I can ask them to message you here.`;
                }
                if (choice.toLowerCase().includes('share')) {
                    // Still send the brief and reminder after showing location info
                    setTimeout(() => sendPreBoardBriefAndReminder(), 1000);
                    return `Tap the paperclip and choose "Share Location" — I'll arrange someone to come to you.`;
                }
                if (choice.toLowerCase().includes('call me')) {
                    // Still send the brief and reminder after confirming call
                    setTimeout(() => sendPreBoardBriefAndReminder(), 1000);
                    return `Done — I'll call you when it's time to head to the meeting point.`;
                }
                if (choice.toLowerCase().includes('no thanks') || choice.toLowerCase().includes('no')) {
                    // fall through to pre-board brief
                }
            }
            // Send the brief and reminder immediately for "no thanks" or any unrecognized input
            setTimeout(() => sendPreBoardBriefAndReminder(), 100);
            return "Perfect!"; // Provide immediate feedback
        }

        return "All set! I’ll be here if you need anything before boarding.";
    }

    // (timed reminder now scheduled directly when preFlightStep becomes 'complete')

    // After journey feedback flow
    if (conversationState.journeyStage === 'after_journey') {
        return handleAfterJourneyFeedback(message, userMessage);
    }

    // Travel confirmation (on the day stage)
    if (conversationState.journeyStage === 'on_the_day') {
        // Handle disabled parking confirmation (after they said yes to travel)
        if (conversationState.confirmedTravel && (message.includes('yes') || message.includes('still want') || message.includes('parking'))) {
            // Send the follow-up message after a delay
            setTimeout(() => {
                addMessage('Once you arrive and park, please say "I\'ve arrived" and someone will come to meet you.', 'bot');
            }, 1500);
            
            return "Perfect! Please try to arrive 3 hours before departure (so by 15:20 for your 18:20 flight).\n\n🅿️ Here's the disabled parking location:\n\n📍 Heathrow Terminal 2 - Short Stay Car Park 2, Level 2\n\n🗺️ Map link: https://maps.google.com/maps?q=51.4706,-0.4619\n\nThis will take you directly to the disabled parking spaces.";
        }
        
        if (conversationState.confirmedTravel && (message.includes('no') || message.includes('different') || message.includes('change'))) {
            return "No problem! Where would you prefer to be met instead? I can arrange for the team to meet you at:\n\n• Terminal 2 Drop Off Zone\n• Heathrow Express Terminal\n• Assistance Desk (inside departures)\n• Another location of your choice";
        }
        
        // Initial travel confirmation (only if not already confirmed)
        if (!conversationState.confirmedTravel && (message.includes('yes') || message.includes('still') || message.includes('traveling') || message.includes('going'))) {
            // Set flag to track that they confirmed travel
            conversationState.confirmedTravel = true;
            return "Great! Do you still want to be met at the disabled parking area as planned?";
        }
        
        if (message.includes('no') || message.includes('cancel') || message.includes('not traveling')) {
            return "Thanks for letting me know you're not traveling today. I've updated your status and notified the airport and airline to cancel your assistance booking. This helps them allocate resources to other passengers who need support.\n\nIf your plans change, just message me and I can reactivate everything instantly. Have a good day! 😊";
        }
    }
    
    // Flight booking/ticket scanning
    if (message.includes('flight') || message.includes('ticket') || message.includes('book')) {
        return "I can help you with your flight! You can either:\n\n📱 Take a photo of your ticket\n✈️ Tell me your flight details\n🔍 I'll then coordinate with the airport and airline to ensure your needs are met\n\nWhat would you prefer?";
    }
    
    // Photo/ticket scanning simulation
    if (message.includes('photo') || message.includes('scan') || message.includes('picture')) {
        simulateTicketScan();
        return "📸 Great! Please take a photo of your boarding pass or ticket, and I'll extract all the details for you.";
    }
    
    // Airport information - stage aware
    if (message.includes('airport') || message.includes('terminal') || message.includes('gate')) {
        if (conversationState.journeyStage === 'departure_airport' || conversationState.journeyStage === 'pre_flight') {
            const flight = conversationState.currentFlight;
            return `🏢 You're at ${flight?.from === 'LHR' ? 'Heathrow Terminal 2' : 'the airport'}! Here's your current status:\n\n✅ **Your Flight:** ${flight?.flight || 'BA 789'} to ${flight?.to || 'JFK'}\n🚪 **Gate:** ${flight?.gate || 'B7'} (no changes)\n⏰ **Departure:** ${flight?.departure || '18:20'} (on time)\n♿ **Your Services:** All arranged and confirmed\n\n📍 Gate B7 is a 5-minute walk from security. Need directions or any other help?`;
        }
        return "🏢 I can provide detailed airport information including:\n\n• Accessible facilities and services\n• Real-time updates on your gate\n• Navigation assistance\n• Contact information for assistance\n• Current wait times for services\n\nWhich airport are you traveling through?";
    }
    
    // Feedback - stage aware
    if (message.includes('feedback') || message.includes('review') || message.includes('rate')) {
        if (conversationState.journeyStage === 'after_journey') {
            const flight = conversationState.currentFlight;
            const needs = conversationState.accessibilityNeeds.join(' and ').toLowerCase();
            return `📝 Perfect timing for feedback! You've just completed your journey from ${flight?.from || 'London'} to ${flight?.to || 'New York'} with ${needs} support.\n\n⭐ **Rate your experience:**\n• Heathrow Terminal 2 accessibility services\n• British Airways cabin crew support\n• Overall journey accessibility\n\n💬 **Your feedback helps:**\n• Improve services for future passengers\n• Train staff on accessibility needs\n• Shape airport and airline policies\n\nHow would you rate each part of your journey? (1-5 stars)`;
        }
        return "📝 Your feedback is incredibly valuable! I can help you:\n\n⭐ Rate your experience with the airport and airline\n💬 Submit detailed feedback about accessibility services\n📧 File formal complaints or commendations\n📊 See how your feedback helps improve services\n\nHow was your recent travel experience?";
    }
    
    // Thank you response
    if (message.includes('thank you') || message.includes('thanks')) {
        return "You're welcome! And thanks for providing the teams with your details! We'll be in touch! 😊";
    }
    
    // Emergency/help
    if (message.includes('help') || message.includes('emergency') || message.includes('problem')) {
        return "🚨 I'm here to help! I can:\n\n📞 Connect you directly with airport assistance\n✈️ Contact your airline immediately\n🗺️ Help you navigate to the nearest help desk\n👥 Arrange for staff to meet you at your location\n\nWhat kind of assistance do you need right now?";
    }
    
    // Default responses based on journey stage
    const stageDefaults = stageContext.defaultResponses || [
        "I understand! How can I help make your journey more accessible?",
        "That's great to know. Is there anything specific I can assist you with for your upcoming travel?",
        "I'm here to help with all your accessibility needs. What would you like to do next?",
        "Thanks for sharing that with me. How else can I support your travel experience?"
    ];
    
    return stageDefaults[Math.floor(Math.random() * stageDefaults.length)];
}

// Journey stage context and responses
function getStageContext(stage) {
    const contexts = {
        new_user: {
            greeting: "👋 Welcome! I'm here to help make your aviation journey accessible and stress-free. Let's start by setting up your profile so I can provide personalized assistance.",
            profileSetup: "Perfect! As a new user, let's create your accessibility profile. This will help airports and airlines prepare for your needs. What's your name and what assistance do you typically require?",
            defaultResponses: [
                "As a new user, I'd love to help you get started! Would you like to set up your accessibility profile?",
                "Welcome aboard! Let me know your accessibility needs and I'll make sure your future journeys are smooth.",
                "I'm here to make aviation accessible for you. What would you like to know about our services?"
            ]
        },
        request_assistance: {
            greeting: "🆘 I see you need assistance! Please share your travel plans with me. You can take a photo of your ticket, upload your booking confirmation, or just tell me your flight details and accessibility needs.",
            defaultResponses: [
                "Share your flight details and I'll set up your accessibility support - photo, upload, or just tell me!",
                "I can help once I know your travel plans. Ticket photo, booking details, or conversation - whatever works for you.",
                "Let's get your assistance arranged! What's your flight and what accessibility support do you need?"
            ]
        },
        entry_via_airline: {
            greeting: "Hi Jim! I'm your PA Assistant from British Airways. I help make travel easier for passengers who need assistance.",
            defaultResponses: [
                "Perfect! I'll ask a few quick questions about what help you need, then share this with the Heathrow team so they can take great care of you.",
                "I have your flight details from British Airways. Let's make sure you get exactly the right support.",
                "Great! Let's set up the perfect assistance for your journey."
            ]
        },
        confirm_assistance: {
            greeting: "✅ Perfect! I've received your details from British Airways. Your wheelchair assistance is confirmed for BA 789 to JFK today. All airport and airline services have been notified. Is there anything else you need help with?",
            defaultResponses: [
                "Your assistance is all confirmed! The airport and airline teams are ready for you. Any other needs?",
                "Everything's set up based on your airline booking. Is there anything else I should arrange?",
                "Your accessibility support is confirmed and coordinated. What else can I help you with?"
            ]
        },
        on_the_day: {
            greeting: "📅 Good morning Jim! It's your travel day. Are you still planning to fly to JFK on flight BA 789 departing at 18:20 today?",
            defaultResponses: [
                "Are you still flying to JFK today?",
                "Confirming your flight BA 789 to JFK today - yes or no?",
                "Travel day check: Still flying to JFK today?",
                "Good morning! Are you still traveling today?"
            ]
},
        departure_airport: {
            greeting: "🏢 You're in the departure area! I can help you find your gate, coordinate services, and ensure you're ready for boarding.",
            defaultResponses: [
                "How can I help you in the departure area? Need gate directions or service coordination?",
                "I'm here to ensure your departure goes smoothly. What assistance do you need?",
                "Let me help you prepare for departure. Do you need help with boarding or services?"
            ]
        },
        pre_flight: {
            greeting: "🚪 Almost time to board! I can coordinate with airline staff about your seating, equipment, and boarding assistance.",
            defaultResponses: [
                "Boarding time is approaching! Do you need help with seating arrangements or boarding assistance?",
                "I can coordinate with the airline about your accessibility needs for boarding and seating.",
                "Let me ensure everything is ready for your flight. Any last-minute assistance needed?"
            ]
        },
        on_flight: {
            greeting: "✈️ You're airborne! I'm here if you need to communicate any issues to the cabin crew or coordinate arrival assistance.",
            defaultResponses: [
                "How's your flight going? I can help communicate with the crew if needed.",
                "I'm here if you need assistance during the flight or want to arrange arrival services.",
                "Need help communicating with the cabin crew or preparing for arrival?"
            ]
        },
        arrival_airport: {
            greeting: "🛬 Welcome to your destination! I can help you navigate arrival procedures and coordinate ground transportation or connecting flights.",
            defaultResponses: [
                "You've arrived! Do you need help with baggage, customs, or ground transportation?",
                "I can coordinate arrival assistance and help you navigate to your next destination.",
                "Welcome to your destination! How can I help with your arrival process?"
            ]
        },
        after_journey: {
            greeting: "🏁 Hope you had a great journey! I'd love to hear about your experience and help you provide feedback to improve services.",
            defaultResponses: [
                "How was your journey? I'd love to collect your feedback to help improve accessibility services.",
                "Your experience matters! Would you like to rate your journey and share feedback?",
                "Thank you for traveling with us! Your feedback helps make aviation more accessible for everyone."
            ]
        }
    };
    
    return contexts[stage] || contexts.new_user;
}

// Update journey stage and provide contextual greeting
function updateJourneyStage(newStage) {
    const previousStage = conversationState.journeyStage;
    conversationState.journeyStage = newStage;
    
    // Focus the text input whenever any stage is selected
    setTimeout(() => {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.focus();
        }
    }, 100); // Small delay to ensure stage change is complete
    
    // Clear any existing timeouts to prevent conflicting messages
    // This prevents old airline route messages from appearing when switching stages
    
    // Add contextual message when stage changes
    if (previousStage !== newStage) {
        // Reset any ongoing conversation flows when switching stages
        conversationState.waitingForOptionsResponse = false;
        conversationState.assistanceStep = null;
        conversationState.waitingForNumericInput = false;
        if (newStage === 'pre_flight') {
            conversationState.preFlightStep = null;
            conversationState.preFlightReminderScheduled = false;
            if (conversationState.autoProgressTimeout) {
                clearTimeout(conversationState.autoProgressTimeout);
                conversationState.autoProgressTimeout = null;
            }
        }
        if (newStage === 'on_flight') {
            conversationState.onFlightStep = null;
        }
        if (newStage === 'after_journey') {
            conversationState.feedbackStep = null;
            conversationState.feedbackRatings = {};
            conversationState.feedbackComments = {};
            conversationState.currentRatingStage = null;
        }
        
        // Update conversation state based on completed stages
        updateCompletedStages(newStage);
        
        const stageContext = getStageContext(newStage);
        const progressiveGreeting = getProgressiveGreeting(newStage, previousStage);
        
        setTimeout(() => {
            // Don't send automatic greeting for departure_airport - wait for user to say "I've arrived"
            if (newStage !== 'departure_airport') {
                addMessage(progressiveGreeting, 'bot');
            }
            
            // Handle pre_flight stage initialization when switching to it
            if (newStage === 'pre_flight' && !conversationState.preFlightStep) {
                conversationState.preFlightStep = 'complete';
                
                // Schedule the messages directly
                setTimeout(() => {
                    console.log('Sending pre-board brief...');
                    const meetInfo = getPreFlightMeetInfo();
                    addMessage(`Pre-boarding brief:

• Meet time: ${meetInfo.meetTime}
• Walk time to gate: ${meetInfo.walkMinutes} minutes
• If anything changes, just message "help" and I'll update the team

I'll be here if you need me — enjoy your time and I'll prompt you when it's time to go.`, 'bot');
                }, 1000);
                
                setTimeout(() => {
                    console.log('Sending time passes message...');
                    addMessage('(time passes...)', 'bot');
                }, 1200);
                
                setTimeout(() => {
                    console.log('Sending reminder message...');
                    const info = getPreFlightMeetInfo();
                    const meetingPlace = conversationState.meetingLocation || 'the Assistance Desk';
                    addMessage(`⏳ Reminder: Mark will come to meet you in 15 minutes at ${meetingPlace} (${info.meetTime}). Please settle your bill and be ready. If you need help, type "help".`, 'bot');
                }, 1400);
            }
            
            // Handle on_flight stage initialization when switching to it
            if (newStage === 'on_flight' && !conversationState.onFlightStep) {
                conversationState.onFlightStep = 'complete';
                
                // Send the two follow-up messages
                setTimeout(() => {
                    const accessibilityDetails = conversationState.accessibilityNeeds.join(' and ').toLowerCase() || 'your accessibility needs';
                    addMessage(`Here's what the cabin crew know about you:

• Passenger: ${conversationState.userName || 'Jim Beattie'}
• Accessibility needs: ${accessibilityDetails}
• Meeting assistance: Arranged at ${conversationState.meetingLocation || 'Assistance Desk'}
• Special requirements: All noted in your profile

If you have any questions or need assistance during the flight, please ask the cabin crew directly - they're fully briefed and ready to help!`, 'bot');
                }, 1000);
                
                setTimeout(() => {
                    addMessage(`Just so you know - we don't work directly with JFK airport, so we won't be able to pass messages to them during your flight.

But don't worry! We'll be in touch after you arrive to hear about your experience. Your feedback helps us improve our service and we share it (anonymously) with airports and airlines to make travel better for everyone! ✈️`, 'bot');
                }, 2500);
            }
            
            // Add follow-up message for airline route only
            if (newStage === 'entry_via_airline') {
                setTimeout(() => {
                    // Calculate date 7 days from today
                    const flightDate = new Date();
                    flightDate.setDate(flightDate.getDate() + 7);
                    const formattedDate = flightDate.toLocaleDateString('en-GB', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                    });
                    
                    const flight = conversationState.currentFlight;
                    const followUpMessage = `I see you are travelling to ${flight?.to || 'JFK'} on flight ${flight?.flight || 'BA 789'} departing at ${flight?.departure || '18:20'} on ${formattedDate}. Is this correct?`;
                    addMessage(followUpMessage, 'bot');
                }, 1500);
            }
            // Don't add quick start tips for airline routes, on the day, pre-flight, on_flight, departure airport, or after_journey
            else if (newStage !== 'confirm_assistance' && newStage !== 'on_the_day' && newStage !== 'pre_flight' && newStage !== 'on_flight' && newStage !== 'departure_airport' && newStage !== 'after_journey') {
                setTimeout(() => {
                    addMessage('💡 **Quick Start Tips:**\n\n• Say "set up profile" to create your accessibility profile\n• Type "scan ticket" to simulate ticket scanning\n• Ask about "airport info" for facility details\n• Try "help" for emergency assistance\n• Use the radio buttons above to simulate different journey stages\n\nWhat would you like to try first?', 'bot');
                }, 3000);
            }
        }, 500);
    }
}

// Update conversation state based on journey progression
function updateCompletedStages(currentStage) {
    const directRoute = ['new_user', 'request_assistance'];
    const airlineRoute = ['entry_via_airline', 'confirm_assistance'];
    const commonRoute = ['on_the_day', 'departure_airport', 'pre_flight', 'on_flight', 'arrival_airport', 'after_journey'];
    
    // Determine which route and stage
    let routeType = 'direct';
    let stageIndex = -1;
    
    if (directRoute.includes(currentStage)) {
        routeType = 'direct';
        stageIndex = directRoute.indexOf(currentStage);
    } else if (airlineRoute.includes(currentStage)) {
        routeType = 'airline';
        stageIndex = airlineRoute.indexOf(currentStage);
    } else if (commonRoute.includes(currentStage)) {
        routeType = 'common';
        stageIndex = commonRoute.indexOf(currentStage);
    }
    
    // Set up profile based on route completion
    if ((routeType === 'direct' && stageIndex >= 1) || 
        (routeType === 'airline' && stageIndex >= 0) || 
        (routeType === 'common')) {
        
        if (!conversationState.hasProfile) {
            conversationState.hasProfile = true;
            conversationState.userName = conversationState.userName || 'Sarah';
            conversationState.accessibilityNeeds = conversationState.accessibilityNeeds.length > 0 
                ? conversationState.accessibilityNeeds 
                : ['Wheelchair assistance'];
        }
    }
    
    // Set up flight details for assistance stages and beyond
    if ((routeType === 'direct' && stageIndex >= 1) || 
        (routeType === 'airline' && stageIndex >= 1) || 
        (routeType === 'common')) {
        
        if (!conversationState.currentFlight) {
            // Calculate date 1 week from today
            const flightDate = new Date();
            flightDate.setDate(flightDate.getDate() + 7);
            const formattedDate = flightDate.toLocaleDateString('en-GB', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
            });
            
            conversationState.currentFlight = {
                airline: 'British Airways',
                flight: 'BA 789',
                from: 'LHR',
                to: 'JFK',
                departure: '18:20',
                date: formattedDate,
                gate: 'B7',
                seat: '12A'
            };
            updatePassengerData();
        }
    }
}

// Generate progressive greeting that acknowledges completed stages
function getProgressiveGreeting(currentStage, previousStage) {
    const baseContext = getStageContext(currentStage);
    const progressiveGreetings = {
        request_assistance: "🆘 I see you need assistance! Please share your travel plans - photo of ticket, booking details, or just tell me your flight and accessibility needs.",
        
        entry_via_airline: "Hi Jim! I'm your PA Assistant from British Airways. I help make travel easier for passengers who need assistance.",
        
        confirm_assistance: "✅ Perfect! Your wheelchair assistance is confirmed for BA 789 to JFK today based on your airline booking. All services have been notified. Anything else you need?",
        
        on_the_day: `📅 Good morning Jim! It's your travel day. Are you still planning to fly to JFK on flight BA 789 departing at 18:20 today?`,
        

        
        departure_airport: `🏢 Great! You've successfully checked in and made it through security. Your ${conversationState.accessibilityNeeds.join(' and ').toLowerCase()} arrangements are confirmed. Your flight ${conversationState.currentFlight?.flight || 'BA 789'} to ${conversationState.currentFlight?.to || 'JFK'} departs at ${conversationState.currentFlight?.departure || '18:20'} from Gate ${conversationState.currentFlight?.gate || 'B7'}.`,
        
        pre_flight: `Thanks! I've got you checked in at your chosen waiting spot. 🍽️ Enjoy your time before boarding!

If you need help while you're waiting, you can:
1. Type "help" here and I'll notify the team
2. Ask the venue staff to call the Assistance Desk
3. Share your location and I'll arrange someone to meet you`,
        
        on_flight: `✈️ Welcome aboard ${conversationState.currentFlight?.flight || 'BA 789'}! You've successfully boarded with your assistance. The cabin crew has been briefed about your ${conversationState.accessibilityNeeds.join(' and ').toLowerCase()} needs.`,
        
        arrival_airport: `🛬 Welcome to ${conversationState.currentFlight?.to || 'New York'}! Your flight has arrived safely. Since you had ${conversationState.accessibilityNeeds.join(' and ').toLowerCase()} on departure, arrival assistance is ready to help you disembark and navigate through customs.`,
        
        after_journey: `🏁 Journey complete! You've successfully traveled from ${conversationState.currentFlight?.from || 'London'} to ${conversationState.currentFlight?.to || 'New York'} with full accessibility support at every stage. Would you like to share feedback about your experience? (Yes/No)`
    };
    
    return progressiveGreetings[currentStage] || baseContext.greeting;
}

// Handle step-by-step assistance questions
function handleAssistanceQuestions(message, originalMessage) {
    const step = conversationState.assistanceStep;
    
    switch (step) {
        case 'check_in':
            if (message.includes('yes') || message.includes('need') || message.includes('help')) {
                conversationState.assistanceNeeds = conversationState.assistanceNeeds || [];
                conversationState.assistanceNeeds.push('Check-in assistance');
                conversationState.assistanceStep = 'security';
                return "Great! I've got check-in help noted. How about security? Would you like assistance getting through? (This means priority lanes and help with procedures)";
            } else {
                conversationState.assistanceStep = 'security';
                return "No worries! You've got check-in covered. How about security - would you like help getting through? (Priority lanes and assistance with procedures)";
            }
            
        case 'security':
            if (message.includes('yes') || message.includes('need') || message.includes('help')) {
                conversationState.assistanceNeeds = conversationState.assistanceNeeds || [];
                conversationState.assistanceNeeds.push('Security assistance');
                conversationState.assistanceStep = 'boarding';
                return "Perfect! Security help is sorted. What about boarding? Would you like assistance getting on the plane? (Priority boarding and help to your seat)";
            } else {
                conversationState.assistanceStep = 'boarding';
                return "Great! You're all set for security. What about boarding - need help getting on the plane? (Priority boarding and help to your seat)";
            }
            
        case 'boarding':
            if (message.includes('yes') || message.includes('need') || message.includes('help')) {
                conversationState.assistanceNeeds = conversationState.assistanceNeeds || [];
                conversationState.assistanceNeeds.push('Boarding assistance');
                conversationState.assistanceStep = 'waiting';
                return "Brilliant! Boarding help is all set. Now, here's something nice - instead of waiting at your gate, would you prefer somewhere more comfortable? Terminal 2 has some lovely spots!";
            } else {
                conversationState.assistanceStep = 'waiting';
                return "Perfect! You're all set for boarding. Now, here's a nice touch - instead of waiting at your gate, would you prefer somewhere more comfortable? Terminal 2 has some great options!";
            }
            
        case 'waiting':
            if (message.includes('yes') || message.includes('prefer') || message.includes('comfortable') || message.includes('somewhere')) {
                conversationState.assistanceStep = 'category_choice';
                const waitingOptions = [
                    'Restaurant',
                    'Bar', 
                    'Quiet Area',
                    'Straight to Gate',
                    'Standard Assistance Area'
                ];
                return createOptionsMessage("Wonderful! What kind of place sounds good to you?", waitingOptions);
            } else {
                conversationState.assistanceStep = 'summary';
                conversationState.preferredWaitingArea = 'your departure gate';
                conversationState.waitingForNumericInput = false;
                return generateAssistanceSummary();
            }
            
        case 'category_choice':
            // Debug: Log what we're checking
            console.log('Category choice - original message:', originalMessage);
            console.log('Category choice - waitingForNumericInput:', conversationState.waitingForNumericInput);
            console.log('Category choice - lastOptions:', conversationState.lastOptions);
            
            // Handle numeric input first - need original message, not lowercase
            const numericChoice = processNumericInput(originalMessage, conversationState);
            let choiceText = message;
            if (numericChoice) {
                choiceText = numericChoice.toLowerCase();
                console.log('Category choice - numeric choice found:', numericChoice);
            }
            
            console.log('Category choice - final choiceText:', choiceText);
            
            if (choiceText.includes('restaurant') || choiceText.includes('food') || choiceText.includes('eat')) {
                conversationState.assistanceStep = 'location_options';
                conversationState.waitingForNumericInput = false; // Clear flag after successful processing
                const restaurantOptions = [
                    'Wagamama (delicious Asian food)',
                    'Café Nero (coffee & tasty light meals)',
                    'Pret A Manger (fresh sandwiches & salads)',
                    'Giraffe (international favorites)',
                    'Yo! Sushi (fresh Japanese)'
                ];
                return createOptionsMessage("Great choice! Here are some lovely restaurants in Terminal 2:", restaurantOptions);
            } else if (choiceText.includes('bar') || choiceText.includes('drink') || choiceText.includes('alcohol')) {
                conversationState.assistanceStep = 'location_options';
                conversationState.waitingForNumericInput = false; // Clear flag after successful processing
                const barOptions = [
                    'The Perfectionists\' Café (great cocktails & food)',
                    'Gordon Ramsay Plane Food (upscale dining & drinks)',
                    'Caffe Nero Bar (wine & coffee)',
                    'All Bar One (relaxed atmosphere)',
                    'Pret A Manger (beer & wine too)'
                ];
                return createOptionsMessage("Perfect! Here are some nice spots for a drink in Terminal 2:", barOptions);
            } else if (choiceText.includes('quiet') || choiceText.includes('peaceful') || choiceText.includes('calm')) {
                conversationState.assistanceStep = 'location_options';
                conversationState.waitingForNumericInput = false; // Clear flag after successful processing
                const quietOptions = [
                    'WHSmith Lounge area (comfy chairs)',
                    'Departure Lounge quiet zones (peaceful areas)',
                    'Terminal 2 Relaxation pods (private & quiet)',
                    'Business-style seating (near gates)',
                    'Reading areas (by the bookshops)'
                ];
                return createOptionsMessage("Lovely choice for a peaceful wait! Here are the quiet spots in Terminal 2:", quietOptions);
            } else if (choiceText.includes('gate') || choiceText.includes('straight')) {
                conversationState.assistanceStep = 'summary';
                conversationState.preferredWaitingArea = 'straight to your departure gate';
                conversationState.waitingForNumericInput = false; // Clear flag after successful processing
                return generateAssistanceSummary();
            } else if (choiceText.includes('assistance') || choiceText.includes('standard')) {
                conversationState.assistanceStep = 'summary';
                conversationState.preferredWaitingArea = 'the standard Assistance Area';
                conversationState.waitingForNumericInput = false; // Clear flag after successful processing
                return generateAssistanceSummary();
            } else {
                // Keep waiting for numeric input since this didn't match
                console.log('Category choice - no match found, retrying with options');
                const waitingOptions = [
                    'Restaurant',
                    'Bar', 
                    'Quiet Area',
                    'Straight to Gate',
                    'Standard Assistance Area'
                ];
                return createOptionsMessage("I didn't catch that. Please choose from:", waitingOptions);
            }
            
        case 'location_options':
            const locationChoice = processNumericInput(originalMessage, conversationState);
            conversationState.preferredWaitingArea = locationChoice || originalMessage;
            conversationState.assistanceStep = 'summary';
            conversationState.waitingForNumericInput = false;
            return generateAssistanceSummary();
            
        case 'accessibility_types':
            // Handle multiple selections (e.g., "1,2" or "1, 3")
            const selections = originalMessage.split(',').map(s => s.trim());
            const selectedTypes = [];
            
            selections.forEach(selection => {
                const numericChoice = processNumericInput(selection, conversationState);
                if (numericChoice) {
                    selectedTypes.push(numericChoice);
                } else if (selection.toLowerCase().includes('sensory')) {
                    selectedTypes.push('Sensory impairment (hearing, vision)');
                } else if (selection.toLowerCase().includes('mobility')) {
                    selectedTypes.push('Mobility impairment (walking, wheelchair)');
                } else if (selection.toLowerCase().includes('cognitive')) {
                    selectedTypes.push('Cognitive impairment (memory, learning)');
                } else if (selection.toLowerCase().includes('none')) {
                    selectedTypes.push('None of the above');
                } else if (selection.toLowerCase().includes('prefer not')) {
                    selectedTypes.push('Prefer not to say');
                }
            });
            
            // Initialize accessibility details
            conversationState.accessibilityDetails = {
                impairmentTypes: selectedTypes,
                specificConditions: [],
                mobilityDetails: null
            };
            
            if (selectedTypes.includes('None of the above') || selectedTypes.includes('Prefer not to say')) {
                // Skip to additional info collection
                conversationState.assistanceStep = 'heathrow_additional';
                return "Perfect! I have all your accessibility needs noted. Is there anything else you'd like me to share with the Heathrow team? This could be things like preferred communication methods, specific concerns, or any other details that would help them provide better support. (If not, just say 'no' or 'nothing additional')";
            } else if (selectedTypes.some(type => type.includes('Sensory'))) {
                // Start with sensory details
                conversationState.assistanceStep = 'sensory_details';
                const sensoryOptions = [
                    'Hearing impairment',
                    'Visual impairment', 
                    'Deaf or hard of hearing',
                    'Blind or low vision',
                    'Other sensory condition'
                ];
                return createOptionsMessage("Thanks! Can you tell me more about your sensory needs?", sensoryOptions);
            } else if (selectedTypes.some(type => type.includes('Mobility'))) {
                // Start with mobility details
                conversationState.assistanceStep = 'mobility_details';
                const mobilityOptions = [
                    'I need an airport wheelchair',
                    'I have my own wheelchair',
                    'I can walk but need assistance',
                    'Other mobility needs'
                ];
                return createOptionsMessage("Thanks! What kind of mobility support do you need?", mobilityOptions);
            } else if (selectedTypes.some(type => type.includes('Cognitive'))) {
                // Start with cognitive details
                conversationState.assistanceStep = 'cognitive_details';
                const cognitiveOptions = [
                    'Memory or attention difficulties',
                    'Learning disabilities',
                    'Autism spectrum',
                    'Other cognitive needs'
                ];
                return createOptionsMessage("Thanks! Can you tell me more about your cognitive support needs?", cognitiveOptions);
            }
            break;
            
        case 'sensory_details':
            const sensoryChoice = processNumericInput(originalMessage, conversationState);
            const selectedSensory = sensoryChoice || originalMessage;
            conversationState.accessibilityDetails.specificConditions.push(selectedSensory);
            
            // Check if they also have mobility needs
            if (conversationState.accessibilityDetails.impairmentTypes.some(type => type.includes('Mobility'))) {
                conversationState.assistanceStep = 'mobility_details';
                const mobilityOptions = [
                    'I need an airport wheelchair',
                    'I have my own wheelchair', 
                    'I can walk but need assistance',
                    'Other mobility needs'
                ];
                return createOptionsMessage("Got it! Now about mobility - what support do you need?", mobilityOptions);
            } else if (conversationState.accessibilityDetails.impairmentTypes.some(type => type.includes('Cognitive'))) {
                conversationState.assistanceStep = 'cognitive_details';
                const cognitiveOptions = [
                    'Memory or attention difficulties',
                    'Learning disabilities',
                    'Autism spectrum',
                    'Other cognitive needs'
                ];
                return createOptionsMessage("Perfect! And for cognitive support - what would help you most?", cognitiveOptions);
            } else {
                conversationState.assistanceStep = 'heathrow_additional';
                return "Perfect! I have all your accessibility needs noted. Is there anything else you'd like me to share with the Heathrow team? This could be things like preferred communication methods, specific concerns, or any other details that would help them provide better support. (If not, just say 'no' or 'nothing additional')";
            }
            break;
            
        case 'mobility_details':
            const mobilityChoice = processNumericInput(originalMessage, conversationState);
            const selectedMobility = mobilityChoice || originalMessage;
            
            if (selectedMobility.toLowerCase().includes('wheelchair')) {
                conversationState.assistanceStep = 'wheelchair_transfer';
                const transferOptions = [
                    'Yes, I need help transferring to my seat',
                    'No, I can transfer myself',
                    'It depends on the situation'
                ];
                return createOptionsMessage("Do you need help getting from your wheelchair to your seat on the plane?", transferOptions);
            } else {
                conversationState.accessibilityDetails.mobilityDetails = selectedMobility;
                
                // Check if they also have cognitive needs
                if (conversationState.accessibilityDetails.impairmentTypes.some(type => type.includes('Cognitive'))) {
                    conversationState.assistanceStep = 'cognitive_details';
                    const cognitiveOptions = [
                        'Memory or attention difficulties',
                        'Learning disabilities',
                        'Autism spectrum',
                        'Other cognitive needs'
                    ];
                    return createOptionsMessage("Thanks! And for cognitive support - what would help you most?", cognitiveOptions);
                } else {
                    conversationState.assistanceStep = 'final_summary';
                    return generateFinalSummary();
                }
            }
            break;
            
        case 'wheelchair_transfer':
            const transferChoice = processNumericInput(originalMessage, conversationState);
            const selectedTransfer = transferChoice || originalMessage;
            conversationState.accessibilityDetails.mobilityDetails = `Wheelchair user - ${selectedTransfer}`;
            
            // Check if they also have cognitive needs
            if (conversationState.accessibilityDetails.impairmentTypes.some(type => type.includes('Cognitive'))) {
                conversationState.assistanceStep = 'cognitive_details';
                const cognitiveOptions = [
                    'Memory or attention difficulties',
                    'Learning disabilities',
                    'Autism spectrum',
                    'Other cognitive needs'
                ];
                return createOptionsMessage("Perfect! And for cognitive support - what would help you most?", cognitiveOptions);
            } else {
                conversationState.assistanceStep = 'heathrow_additional';
                return "Perfect! I have all your accessibility needs noted. Is there anything else you'd like me to share with the Heathrow team? This could be things like preferred communication methods, specific concerns, or any other details that would help them provide better support. (If not, just say 'no' or 'nothing additional')";
            }
            break;
            
        case 'cognitive_details':
            const cognitiveChoice = processNumericInput(originalMessage, conversationState);
            const selectedCognitive = cognitiveChoice || originalMessage;
            conversationState.accessibilityDetails.specificConditions.push(selectedCognitive);
            
            conversationState.assistanceStep = 'heathrow_additional';
            return "Perfect! I have all your accessibility needs noted. Is there anything else you'd like me to share with the Heathrow team? This could be things like preferred communication methods, specific concerns, or any other details that would help them provide better support. (If not, just say 'no' or 'nothing additional')";
            break;
            
        case 'heathrow_additional':
            if (message.includes('no') || message.includes('nothing') || message.includes('none')) {
                conversationState.heathrowAdditional = null;
            } else {
                conversationState.heathrowAdditional = originalMessage;
            }
            
            conversationState.assistanceStep = 'cabin_crew_info';
            return "Thanks! Now, is there anything you'd like the British Airways cabin crew to be made aware of in advance? This helps them prepare to support you during your flight. (Again, just say 'no' if there's nothing specific)";
            break;
            
        case 'cabin_crew_info':
            if (message.includes('no') || message.includes('nothing') || message.includes('none')) {
                conversationState.cabinCrewInfo = null;
            } else {
                conversationState.cabinCrewInfo = originalMessage;
            }
            
            conversationState.assistanceStep = 'send_confirmation';
            return generateConfirmationFlow();
            break;
            
        case 'final_changes':
            if (message.includes('no') || message.includes('nothing') || message.includes('looks good') || message.includes('all good')) {
                conversationState.assistanceStep = null;
                conversationState.waitingForNumericInput = false;
                return "Perfect! ✅ I've sent all your details to both Heathrow Airport and British Airways. They now have your complete accessibility profile and travel preferences.\n\n📞 What happens next:\n\n• Please plan to arrive at Heathrow Terminal 2 three hours before departure\n• We'll be in touch on the day of your departure to provide further assistance\n• Both teams will be fully prepared for your arrival\n• If you need anything in the meantime, just send me a message\n\nHave a wonderful trip! 🛫";
            } else {
                return "I'd be happy to help you make changes! What would you like to update? You can tell me about any part of your travel plan or accessibility needs that you'd like to modify.";
            }
            break;
            
        default:
            return "I'm not sure what you mean. Could you clarify?";
    }
}

// Generate final assistance summary
function generateAssistanceSummary() {
    const needs = conversationState.assistanceNeeds || [];
    const meetingPoint = conversationState.meetingLocation || 'Assistance Desk';
    const waitingArea = conversationState.preferredWaitingArea || 'your departure gate';
    
    let summary = "Brilliant! Here's your personalized travel plan:\n\n";
    summary += `📍 Where we'll meet: ${meetingPoint}\n`;
    
    if (needs.length > 0) {
        summary += `🤝 Help you'll get:\n`;
        needs.forEach(need => {
            summary += `• ${need}\n`;
        });
    } else {
        summary += `🤝 Your approach: Independent travel with boarding help\n`;
    }
    
    summary += `☕ Where you'll wait: ${waitingArea}\n\n`;
    
    // Add accessibility details if available
    if (conversationState.accessibilityDetails) {
        summary += `♿ Accessibility needs:\n`;
        if (conversationState.accessibilityDetails.impairmentTypes) {
            conversationState.accessibilityDetails.impairmentTypes.forEach(type => {
                summary += `• ${type}\n`;
            });
        }
        if (conversationState.accessibilityDetails.specificConditions) {
            conversationState.accessibilityDetails.specificConditions.forEach(condition => {
                summary += `• ${condition}\n`;
            });
        }
        if (conversationState.accessibilityDetails.mobilityDetails) {
            summary += `• ${conversationState.accessibilityDetails.mobilityDetails}\n`;
        }
        summary += `\n`;
    }
    
    // Start accessibility needs flow instead of asking to change
    conversationState.assistanceStep = 'accessibility_types';
    const accessibilityOptions = [
        'Sensory impairment (hearing, vision)',
        'Mobility impairment (walking, wheelchair)',
        'Cognitive impairment (memory, learning)',
        'None of the above',
        'Prefer not to say'
    ];
    return createOptionsMessage("Perfect! Now let's make sure we have all your accessibility needs covered. Do any of these apply to you? (You can select multiple by sending the numbers separated by commas, like '1,2')", accessibilityOptions);
}

// Generate final comprehensive summary
function generateFinalSummary() {
    const needs = conversationState.assistanceNeeds || [];
    const meetingPoint = conversationState.meetingLocation || 'Assistance Desk';
    const waitingArea = conversationState.preferredWaitingArea || 'your departure gate';
    
    let summary = "🎉 Your Complete Travel Plan\n\n";
    summary += `📍 Where we'll meet: ${meetingPoint}\n`;
    
    if (needs.length > 0) {
        summary += `🤝 Help you'll get:\n`;
        needs.forEach(need => {
            summary += `• ${need}\n`;
        });
    } else {
        summary += `🤝 Your approach: Independent travel with boarding help\n`;
    }
    
    summary += `☕ Where you'll wait: ${waitingArea}\n`;
    
    // Add accessibility details if available
    if (conversationState.accessibilityDetails) {
        summary += `♿ Accessibility Support:\n`;
        if (conversationState.accessibilityDetails.impairmentTypes && conversationState.accessibilityDetails.impairmentTypes.length > 0) {
            conversationState.accessibilityDetails.impairmentTypes.forEach(type => {
                if (!type.includes('None') && !type.includes('Prefer not')) {
                    summary += `• ${type}\n`;
                }
            });
        }
        if (conversationState.accessibilityDetails.specificConditions && conversationState.accessibilityDetails.specificConditions.length > 0) {
            conversationState.accessibilityDetails.specificConditions.forEach(condition => {
                summary += `• ${condition}\n`;
            });
        }
        if (conversationState.accessibilityDetails.mobilityDetails) {
            summary += `• ${conversationState.accessibilityDetails.mobilityDetails}\n`;
        }
    }
    
    summary += `\n✅ All set! I'm sharing this complete profile with the Heathrow team right now. They'll have everything ready for your arrival and will be fully prepared to support your specific needs.\n\n`;
    summary += `Is there anything else you'd like to add or change about your accessibility requirements?`;
    
    // Clear the assistance step since we're done
    conversationState.assistanceStep = null;
    conversationState.waitingForNumericInput = false;
    
    return summary;
}

// Handle after journey feedback flow
function handleAfterJourneyFeedback(message, originalMessage) {
    const step = conversationState.feedbackStep;
    
    // Initialize feedback flow on first contact - handle direct yes/no response
    if (!step) {
        conversationState.feedbackStep = 'initial_response';
        
        // Handle direct yes/no to the initial question
        if (message.includes('yes') || message.includes('sure') || message.includes('ok')) {
            const userName = conversationState.userName || 'Jim';
            
            setTimeout(() => {
                addMessage(`🎉 Thank you for using our accessibility assistance service, ${userName}!`, 'bot');
                
                setTimeout(() => {
                    addMessage(`Your feedback is incredibly valuable to us and helps improve accessibility services for all future passengers.`, 'bot');
                    
                    setTimeout(() => {
                        const feedbackOptions = [
                            'Yes, I\'d like to provide detailed feedback',
                            'Just a quick rating would be fine',
                            'Not right now, thanks'
                        ];
                        const optionsMessage = createOptionsMessage('How would you prefer to share your feedback?', feedbackOptions);
                        addMessage(optionsMessage, 'bot');
                        conversationState.feedbackStep = 'initial_choice';
                    }, 1500);
                }, 1000);
            }, 500);
            
            return `Wonderful! Let me gather some feedback to help us serve future passengers even better.`;
        } else if (message.includes('no') || message.includes('not now') || message.includes('skip')) {
            const userName = conversationState.userName || 'Jim';
            return `No problem at all, ${userName}! Thank you for using our accessibility assistance service. We hope your journey was smooth and comfortable.\n\nIf you ever want to share feedback in the future, you can always reach out to us. We hope to assist you again on your future travels! ✈️😊`;
        } else {
            // If they didn't give a clear yes/no, ask again
            return `Please let me know if you'd like to share feedback about your journey experience - just say "yes" or "no". Your feedback helps us improve accessibility services for future passengers.`;
        }
    }
    
    switch (step) {
        case 'initial_choice':
            const choice = processNumericInput(originalMessage, conversationState) || message;
            conversationState.waitingForNumericInput = false;
            
            if (choice.includes('yes') || choice.includes('provide feedback')) {
                conversationState.feedbackStep = 'rating_intro';
                return `Wonderful! I'll walk you through rating each part of your journey, and you can add comments for any stage you'd like.\n\nWe'll cover:\n• Pre-travel booking and coordination\n• Airport arrival and assistance\n• Security and check-in process\n• Pre-flight waiting experience\n• In-flight accessibility support\n• Overall journey experience\n\nReady to start?`;
            } else if (choice.includes('quick rating')) {
                conversationState.feedbackStep = 'quick_rating';
                return `Perfect! I'll just ask for a quick 1-5 star rating for your overall experience.\n\nHow would you rate your overall accessibility assistance experience? (1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent)`;
            } else {
                return `No problem at all! Thank you again for using our service. If you ever want to share feedback in the future, you can always reach out to us.\n\nWe hope to assist you again on your future travels! ✈️😊`;
            }
            
        case 'rating_intro':
            if (message.includes('yes') || message.includes('ready') || message.includes('start') || message.includes('ok')) {
                conversationState.feedbackStep = 'rate_booking';
                conversationState.currentRatingStage = 'booking';
                return `Great! Let's start with the beginning of your journey.\n\n📋 **Pre-travel Booking & Coordination**\nThis includes our initial contact through British Airways, setting up your accessibility profile, and coordinating your assistance needs.\n\nHow would you rate this stage? (1-5 stars, where 1 = Poor and 5 = Excellent)`;
            }
            return `Just say "yes" or "ready" when you'd like to begin the feedback process!`;
            
        case 'rate_booking':
            return handleStageRating('booking', 'Pre-travel Booking & Coordination', originalMessage, 'rate_airport_arrival', 'airport_arrival', 'Airport Arrival & Initial Assistance', 'This includes meeting Mark at the disabled parking area, luggage help, and getting you through the airport entrance.');
            
        case 'rate_airport_arrival':
            return handleStageRating('airport_arrival', 'Airport Arrival & Initial Assistance', originalMessage, 'rate_security_checkin', 'security_checkin', 'Security & Check-in Process', 'This covers assistance with check-in procedures, security screening, and any priority services you received.');
            
        case 'rate_security_checkin':
            return handleStageRating('security_checkin', 'Security & Check-in Process', originalMessage, 'rate_preflight', 'preflight', 'Pre-flight Waiting Experience', 'This includes your chosen waiting location, comfort, and any assistance while waiting for boarding.');
            
        case 'rate_preflight':
            return handleStageRating('preflight', 'Pre-flight Waiting Experience', originalMessage, 'rate_inflight', 'inflight', 'In-flight Accessibility Support', 'This covers boarding assistance, cabin crew support, and your overall flight experience.');
            
        case 'rate_inflight':
            return handleStageRating('inflight', 'In-flight Accessibility Support', originalMessage, 'rate_overall', 'overall', 'Overall Journey Experience', 'Your complete end-to-end accessibility assistance experience.');
            
        case 'rate_overall':
            return handleStageRating('overall', 'Overall Journey Experience', originalMessage, 'feedback_summary', null, null, null);
            
        case 'quick_rating':
            const rating = parseInt(originalMessage.trim());
            if (rating >= 1 && rating <= 5) {
                conversationState.feedbackRatings.overall = rating;
                return generateQuickFeedbackSummary(rating);
            }
            return `Please provide a rating from 1 to 5 stars (where 1 = Poor and 5 = Excellent).`;
            
        case 'comment_booking':
            return handleStageComment('booking', originalMessage, 'rate_airport_arrival', 'airport_arrival', 'Airport Arrival & Initial Assistance', 'This includes meeting Mark at the disabled parking area, luggage help, and getting you through the airport entrance.');
            
        case 'comment_airport_arrival':
            return handleStageComment('airport_arrival', originalMessage, 'rate_security_checkin', 'security_checkin', 'Security & Check-in Process', 'This covers assistance with check-in procedures, security screening, and any priority services you received.');
            
        case 'comment_security_checkin':
            return handleStageComment('security_checkin', originalMessage, 'rate_preflight', 'preflight', 'Pre-flight Waiting Experience', 'This includes your chosen waiting location, comfort, and any assistance while waiting for boarding.');
            
        case 'comment_preflight':
            return handleStageComment('preflight', originalMessage, 'rate_inflight', 'inflight', 'In-flight Accessibility Support', 'This covers boarding assistance, cabin crew support, and your overall flight experience.');
            
        case 'comment_inflight':
            return handleStageComment('inflight', originalMessage, 'rate_overall', 'overall', 'Overall Journey Experience', 'Your complete end-to-end accessibility assistance experience.');
            
        case 'comment_overall':
            return handleStageComment('overall', originalMessage, 'feedback_summary', null, null, null);
            
        case 'feedback_summary':
            return generateFeedbackSummary();
            
        default:
            return "I'm not sure what you mean. Could you clarify?";
    }
}

// Helper function to handle rating for each stage
function handleStageRating(currentStage, stageName, originalMessage, nextStep, nextStageKey, nextStageName, nextStageDescription) {
    const rating = parseInt(originalMessage.trim());
    if (rating >= 1 && rating <= 5) {
        conversationState.feedbackRatings[currentStage] = rating;
        
        // Ask for comment on this stage
        conversationState.feedbackStep = `comment_${currentStage}`;
        return `Thank you! You rated "${stageName}" as ${rating} ${rating === 1 ? 'star' : 'stars'}.\n\nWould you like to add any comments about this part of your journey? This helps us understand what went well and what we can improve. (Or just say "no" to skip)`;
    }
    return `Please provide a rating from 1 to 5 stars for "${stageName}" (where 1 = Poor and 5 = Excellent).`;
}

// Helper function to handle comments for each stage
function handleStageComment(currentStage, originalMessage, nextStep, nextStageKey, nextStageName, nextStageDescription) {
    if (originalMessage.toLowerCase().includes('no') || originalMessage.toLowerCase().includes('skip') || originalMessage.toLowerCase().includes('none')) {
        conversationState.feedbackComments[currentStage] = null;
    } else {
        conversationState.feedbackComments[currentStage] = originalMessage;
    }
    
    conversationState.feedbackStep = nextStep;
    
    if (nextStep === 'feedback_summary') {
        return "Perfect! I have all your ratings and comments. Let me prepare a summary of your feedback.";
    }
    
    conversationState.currentRatingStage = nextStageKey;
    return `Thanks! Now let's move on to the next part of your journey.\n\n${getStageIcon(nextStageKey)} **${nextStageName}**\n${nextStageDescription}\n\nHow would you rate this stage? (1-5 stars, where 1 = Poor and 5 = Excellent)`;
}

// Helper function to get appropriate icons for each stage
function getStageIcon(stage) {
    const icons = {
        booking: '📋',
        airport_arrival: '🏢',
        security_checkin: '🔒',
        preflight: '☕',
        inflight: '✈️',
        overall: '🌟'
    };
    return icons[stage] || '📝';
}

// Generate quick feedback summary for simple rating
function generateQuickFeedbackSummary(rating) {
    const userName = conversationState.userName || 'Jim';
    const flight = conversationState.currentFlight;
    
    let responseMessage = `Thank you, ${userName}! You rated your overall accessibility assistance experience as ${rating} ${rating === 1 ? 'star' : 'stars'}.\n\n`;
    
    if (rating >= 4) {
        responseMessage += `⭐ We're delighted you had a positive experience! Your ${rating}-star rating means a lot to us.`;
    } else if (rating === 3) {
        responseMessage += `📝 Thank you for the feedback. We're glad the service was helpful, and we'll continue working to make it even better.`;
    } else {
        responseMessage += `📝 Thank you for your honest feedback. We take all ratings seriously and will use this to improve our services.`;
    }
    
    responseMessage += `\n\n✅ **What happens next:**\n• Your feedback has been shared with both Heathrow Airport and British Airways\n• This helps them improve accessibility services for future passengers\n• If you have specific concerns, they may follow up with you directly\n\nThank you for choosing our accessibility assistance service. We hope to help make your future travels even better! 🛫`;
    
    // Reset feedback state
    conversationState.feedbackStep = null;
    conversationState.feedbackRatings = {};
    conversationState.feedbackComments = {};
    
    return responseMessage;
}

// Generate comprehensive feedback summary
function generateFeedbackSummary() {
    const userName = conversationState.userName || 'Jim';
    const ratings = conversationState.feedbackRatings;
    const comments = conversationState.feedbackComments;
    
    // Calculate average rating
    const ratingValues = Object.values(ratings);
    const averageRating = (ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length).toFixed(1);
    
    let summaryMessage = `📊 **Your Complete Feedback Summary**\n\nThank you, ${userName}! Here's a summary of your ratings and feedback:\n\n`;
    
    // Add individual ratings
    const stageNames = {
        booking: 'Pre-travel Booking & Coordination',
        airport_arrival: 'Airport Arrival & Initial Assistance',
        security_checkin: 'Security & Check-in Process',
        preflight: 'Pre-flight Waiting Experience',
        inflight: 'In-flight Accessibility Support',
        overall: 'Overall Journey Experience'
    };
    
    Object.keys(ratings).forEach(stage => {
        const rating = ratings[stage];
        const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
        summaryMessage += `${getStageIcon(stage)} **${stageNames[stage]}:** ${stars} (${rating}/5)\n`;
        
        if (comments[stage]) {
            summaryMessage += `   💬 "${comments[stage]}"\n`;
        }
        summaryMessage += '\n';
    });
    
    summaryMessage += `🎯 **Average Rating:** ${averageRating}/5 stars\n\n`;
    
    // Add what happens next based on ratings
    setTimeout(() => {
        addMessage(generateProviderFeedbackMessage(), 'bot');
        
        setTimeout(() => {
            addMessage(`🙏 **Thank you again, ${userName}!**\n\nYour detailed feedback is invaluable in helping us create better accessibility experiences for all travelers. We're committed to continuous improvement, and passenger insights like yours drive meaningful change.\n\nWe hope to assist you again on your future journeys! ✈️😊`, 'bot');
        }, 2000);
    }, 1500);
    
    // Reset feedback state
    conversationState.feedbackStep = null;
    conversationState.feedbackRatings = {};
    conversationState.feedbackComments = {};
    
    return summaryMessage;
}

// Generate provider-specific feedback message
function generateProviderFeedbackMessage() {
    const ratings = conversationState.feedbackRatings;
    
    let providerMessage = `✅ **Your Feedback Has Been Shared**\n\n`;
    
    // Heathrow feedback
    const heathrowStages = ['airport_arrival', 'security_checkin', 'preflight'];
    const heathrowRatings = heathrowStages.filter(stage => ratings[stage]).map(stage => ratings[stage]);
    if (heathrowRatings.length > 0) {
        const heathrowAverage = (heathrowRatings.reduce((sum, rating) => sum + rating, 0) / heathrowRatings.length).toFixed(1);
        providerMessage += `🏢 **Heathrow Airport** (Average: ${heathrowAverage}/5)\n`;
        providerMessage += `• Your feedback about airport arrival, security, and pre-flight services\n`;
        providerMessage += `• Comments about Mark's assistance and facility accessibility\n`;
        providerMessage += `• Suggestions for improving passenger support services\n\n`;
    }
    
    // British Airways feedback
    const baStages = ['booking', 'inflight'];
    const baRatings = baStages.filter(stage => ratings[stage]).map(stage => ratings[stage]);
    if (baRatings.length > 0) {
        const baAverage = (baRatings.reduce((sum, rating) => sum + rating, 0) / baRatings.length).toFixed(1);
        providerMessage += `✈️ **British Airways** (Average: ${baAverage}/5)\n`;
        providerMessage += `• Your experience with initial booking and coordination\n`;
        providerMessage += `• Cabin crew accessibility support and in-flight services\n`;
        providerMessage += `• Feedback about communication and service quality\n\n`;
    }
    
    providerMessage += `📈 **How This Helps:**\n`;
    providerMessage += `• Identifies areas of excellence to maintain and expand\n`;
    providerMessage += `• Highlights improvement opportunities for better service\n`;
    providerMessage += `• Informs staff training and accessibility policy updates\n`;
    providerMessage += `• Helps allocate resources to areas that matter most to passengers`;
    
    return providerMessage;
}

// Generate the 4-message confirmation flow
function generateConfirmationFlow() {
    // Message 1: Confirmation
    setTimeout(() => {
        const userName = conversationState.userName || 'Jim Beattie';
        const flight = conversationState.currentFlight;
        let confirmationMessage = `✅ Perfect! I have everything for ${userName}:\n\n`;
        
        if (flight) {
            confirmationMessage += `👤 Passenger: Jim Beattie (as shown on passport)\n`;
            confirmationMessage += `✈️ ${flight.flight} from ${flight.from} to ${flight.to}\n`;
            confirmationMessage += `📅 Departing ${flight.departure} on ${flight.date}\n`;
            confirmationMessage += `💺 Seat ${flight.seat}`;
        } else {
            confirmationMessage += `👤 Passenger: Jim Beattie (as shown on passport)\n`;
            confirmationMessage += `✈️ BA 789 from LHR to JFK\n`;
            confirmationMessage += `📅 Departing 18:20\n`;
            confirmationMessage += `💺 Seat 12A`;
        }
        
        addMessage(confirmationMessage, 'bot');
    }, 1000);
    
    // Message 2: Heathrow Summary
    setTimeout(() => {
        let heathrowSummary = "📋 Information for Heathrow Airport:\n\n";
        
        heathrowSummary += `• Meeting point: ${conversationState.meetingLocation || 'Assistance Desk'}\n`;
        heathrowSummary += `• Waiting preference: ${conversationState.preferredWaitingArea || 'departure gate'}\n`;
        
        if (conversationState.assistanceNeeds && conversationState.assistanceNeeds.length > 0) {
            heathrowSummary += `• Support needed: ${conversationState.assistanceNeeds.join(', ')}\n`;
        }
        
        if (conversationState.accessibilityDetails) {
            if (conversationState.accessibilityDetails.impairmentTypes && conversationState.accessibilityDetails.impairmentTypes.length > 0) {
                const types = conversationState.accessibilityDetails.impairmentTypes.filter(type => !type.includes('None') && !type.includes('Prefer not'));
                if (types.length > 0) {
                    heathrowSummary += `• Accessibility needs: ${types.join(', ')}\n`;
                }
            }
            if (conversationState.accessibilityDetails.specificConditions && conversationState.accessibilityDetails.specificConditions.length > 0) {
                heathrowSummary += `• Specific conditions: ${conversationState.accessibilityDetails.specificConditions.join(', ')}\n`;
            }
            if (conversationState.accessibilityDetails.mobilityDetails) {
                heathrowSummary += `• Mobility details: ${conversationState.accessibilityDetails.mobilityDetails}\n`;
            }
        }
        
        if (conversationState.heathrowAdditional) {
            heathrowSummary += `• Additional information: ${conversationState.heathrowAdditional}\n`;
        }
        
        addMessage(heathrowSummary, 'bot');
    }, 2500);
    
    // Message 3: British Airways Summary
    setTimeout(() => {
        let baSummary = "✈️ Information for British Airways Cabin Crew:\n\n";
        
        if (conversationState.accessibilityDetails) {
            if (conversationState.accessibilityDetails.impairmentTypes && conversationState.accessibilityDetails.impairmentTypes.length > 0) {
                const types = conversationState.accessibilityDetails.impairmentTypes.filter(type => !type.includes('None') && !type.includes('Prefer not'));
                if (types.length > 0) {
                    baSummary += `• Accessibility needs: ${types.join(', ')}\n`;
                }
            }
            if (conversationState.accessibilityDetails.specificConditions && conversationState.accessibilityDetails.specificConditions.length > 0) {
                baSummary += `• Specific conditions: ${conversationState.accessibilityDetails.specificConditions.join(', ')}\n`;
            }
            if (conversationState.accessibilityDetails.mobilityDetails) {
                baSummary += `• Mobility support: ${conversationState.accessibilityDetails.mobilityDetails}\n`;
            }
        }
        
        if (conversationState.cabinCrewInfo) {
            baSummary += `• Special requests: ${conversationState.cabinCrewInfo}\n`;
        }
        
        if (!conversationState.accessibilityDetails && !conversationState.cabinCrewInfo) {
            baSummary += `• No specific accessibility needs noted\n`;
        }
        
        addMessage(baSummary, 'bot');
    }, 4000);
    
    // Message 4: Final confirmation question
    setTimeout(() => {
        conversationState.assistanceStep = 'final_changes';
        addMessage("Does everything look correct? If you'd like to change anything, just let me know what needs updating. Otherwise, say 'looks good' and I'll send this information to both teams.", 'bot');
    }, 5500);
    
    return "Perfect! Let me show you exactly what information I'll be sharing...";
}

// Get profile-aware response based on current journey stage
function getProfileAwareResponse() {
    const stage = conversationState.journeyStage;
    const userName = conversationState.userName ? `, ${conversationState.userName}` : '';
    const needs = conversationState.accessibilityNeeds.join(' and ').toLowerCase();
    const flight = conversationState.currentFlight;
    
    const responses = {
        new_user: "Your profile is already set up! You can update it anytime by telling me about any changes to your needs.",
        request_assistance: `Your profile shows you need ${needs}${userName}. I can immediately connect you with the right services based on your registered needs.`,
        on_the_day: `Your profile is ready${userName}! Your ${needs} requirements are confirmed for flight ${flight?.flight || 'BA 789'} today.`,

        departure_airport: `Your accessibility profile is active${userName}. All your ${needs} arrangements are confirmed for your departure.`,
        pre_flight: `Everything's ready${userName}! Your seat and ${needs} requirements are all confirmed for boarding.`,
        on_flight: `Your profile ensured smooth boarding${userName}. The crew knows about your ${needs} requirements for the flight.`,
        arrival_airport: `Your arrival profile is active${userName}. Ground services know you'll need ${needs} assistance upon landing.`,
        after_journey: `Your profile helped coordinate ${needs} support throughout your entire journey${userName}. How did everything go?`
    };
    
    return responses[stage] || responses.new_user;
}

function simulateTicketScan() {
    setTimeout(() => {
        // Calculate date 1 week from today
        const flightDate = new Date();
        flightDate.setDate(flightDate.getDate() + 7);
        const formattedDate = flightDate.toLocaleDateString('en-GB', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
        });
        
        const ticketData = {
            airline: 'British Airways',
            flight: 'BA 789',
            from: 'LHR',
            to: 'JFK',
            departure: '18:20',
            date: formattedDate,
            gate: 'TBD',
            seat: '12A'
        };
        
        conversationState.currentFlight = ticketData;
        updatePassengerData();
        
        addMessage(`✅ Ticket scanned successfully!\n\n🎫 **Flight Details:**\n• ${ticketData.airline} ${ticketData.flight}\n• ${ticketData.from} → ${ticketData.to}\n• Departure: ${ticketData.departure} on ${ticketData.date}\n• Seat: ${ticketData.seat}\n\n📋 I've shared your accessibility profile with the airport and airline. They're now prepared for your arrival!\n\nWould you like me to provide airport navigation or service updates?`, 'bot');
    }, 2000);
}

function updatePassengerData() {
    // This would normally sync with a backend
    // For demo purposes, we'll update the dashboard views
    if (conversationState.userName && conversationState.currentFlight) {
        // Add to airport dashboard
        addToAirportDashboard();
        // Add to airline dashboard
        addToAirlineDashboard();
        // Refresh new airport views
        renderMeetingView();
        renderAirsideView();
        refreshAirportDashboardSummary();
    }
}

function addToAirportDashboard() {
    const airportList = document.getElementById('airportPassengerList');
    if (!airportList) return;
    
    const existingCard = Array.from(airportList.children).find(card => 
        card.querySelector('.passenger-name')?.textContent === conversationState.userName
    );
    
    if (!existingCard) {
        const newCard = document.createElement('div');
        newCard.className = 'passenger-card';
        newCard.innerHTML = `
            <div class="passenger-info">
                <div class="passenger-name">${conversationState.userName}</div>
                <div class="passenger-details">${conversationState.currentFlight.flight} → ${conversationState.currentFlight.to} • Gate TBD • Departs ${conversationState.currentFlight.departure}</div>
                <div class="accessibility-needs">
                    ${conversationState.accessibilityNeeds.map(need => `<span class="need-tag">${need}</span>`).join('')}
                </div>
            </div>
            <div class="passenger-status">
                <span class="status-badge checked-in">Profile Ready</span>
                <button class="action-btn" onclick="contactPassenger('${conversationState.userName}')">Contact</button>
            </div>
        `;
        airportList.appendChild(newCard);
    }
}

function addToAirlineDashboard() {
    const airlineList = document.getElementById('airlinePassengerList');
    if (!airlineList) return;
    
    const existingCard = Array.from(airlineList.children).find(card => 
        card.querySelector('.profile-name')?.textContent === conversationState.userName
    );
    
    if (!existingCard) {
        const newCard = document.createElement('div');
        newCard.className = 'profile-card';
        newCard.innerHTML = `
            <div class="profile-header">
                <div class="profile-name">${conversationState.userName}</div>
                <div class="flight-info">${conversationState.currentFlight.flight} • ${conversationState.currentFlight.from} → ${conversationState.currentFlight.to} • ${conversationState.currentFlight.departure}</div>
            </div>
            <div class="profile-details">
                <div class="detail-row">
                    <strong>Accessibility Needs:</strong>
                    <span>${conversationState.accessibilityNeeds.join(', ')}</span>
                </div>
                <div class="detail-row">
                    <strong>Special Requirements:</strong>
                    <span>Profile created via WhatsApp assistant</span>
                </div>
                <div class="detail-row">
                    <strong>Communication:</strong>
                    <span>WhatsApp preferred</span>
                </div>
                <div class="detail-row">
                    <strong>Status:</strong>
                    <span class="rating">🟢 Profile active and shared</span>
                </div>
            </div>
        `;
        airlineList.appendChild(newCard);
    }
}

function contactPassenger(name) {
    alert(`Contacting ${name} via WhatsApp...`);
    // In a real system, this would trigger a notification to the passenger
}

// Attachment functionality
function showAttachmentOptions() {
    const options = [
        '📷 Take Photo of Ticket',
        '📄 Upload Document',
        '🎵 Send Voice Message',
        '📍 Share Location'
    ];
    
    // Store options for potential numeric input
    conversationState.lastOptions = options;
    conversationState.waitingForAttachmentChoice = true;
    
    const optionsMessage = createOptionsMessage('Choose an attachment option:', options);
    addMessage(optionsMessage, 'bot');
}

// Handle attachment choice
function handleAttachmentChoice(choice) {
    conversationState.waitingForAttachmentChoice = false;
    conversationState.waitingForNumericInput = false;
    
    if (choice.includes('photo') || choice.includes('ticket')) {
        simulateTicketScan();
        addMessage('📸 Taking photo of ticket...', 'user');
    } else if (choice.includes('document') || choice.includes('upload')) {
        addMessage('📄 Document uploaded', 'user');
        setTimeout(() => {
            addMessage('I can see your document. How would you like me to help you with this information?', 'bot');
        }, 1000);
    } else if (choice.includes('voice') || choice.includes('message')) {
        toggleVoiceInput();
    } else if (choice.includes('location') || choice.includes('share')) {
        // If we're in departure airport stage and waiting for location, handle it properly
        if (conversationState.journeyStage === 'departure_airport' && conversationState.departureAirportStep === 'location_sharing') {
            // Simulate WhatsApp location sharing
            addMessage("📍 Location shared\n\nHeathrow Terminal 2 - Short Stay Car Park 2\nLevel 2, Space 47\n\n[Live location for 15 minutes]", 'user');
            
            // Continue with the departure airport flow
            setTimeout(() => {
                addMessage("Perfect! I've shared your location with Mark.", 'bot');
                
                setTimeout(() => {
                    addMessage("Mark is on his way to you now! 🚶‍♂️", 'bot');
                    
                    setTimeout(() => {
                        addMessage("For now you'll be messaging with Mark directly. If you need emergency help, type 'help' and we'll notify a supervisor at Heathrow.", 'bot');
                        
                        setTimeout(() => {
                            addMessage("Quick question - do you need Mark to bring someone to help with your luggage? Don't worry, they'll take it straight out of your car for you.", 'bot');
                            conversationState.departureAirportStep = 'luggage_help';
                        }, 2000);
                    }, 1500);
                }, 1000);
            }, 500);
        } else {
            // Default location sharing for other stages
            addMessage('📍 Current location shared', 'user');
            setTimeout(() => {
                addMessage('I can see you\'re at the airport! Let me check what services are available near your location and guide you to the right assistance.', 'bot');
            }, 1000);
        }
    }
}

// Voice functionality
function toggleVoiceInput() {
    const voiceBtn = document.querySelector('.voice-btn i');
    
    if (!conversationState.isVoiceActive) {
        conversationState.isVoiceActive = true;
        voiceBtn.className = 'fas fa-stop';
        voiceBtn.style.color = '#ef4444';
        
        // Simulate voice recording
        setTimeout(() => {
            conversationState.isVoiceActive = false;
            voiceBtn.className = 'fas fa-microphone';
            voiceBtn.style.color = '#666';
            
            addMessage('🎤 Voice message: "Hi, I need help with wheelchair assistance for my flight today"', 'user');
            setTimeout(() => {
                addMessage('I heard your voice message! I can definitely help you with wheelchair assistance. Let me get your flight details and coordinate with the airport services.', 'bot');
            }, 1000);
        }, 3000);
    } else {
        conversationState.isVoiceActive = false;
        voiceBtn.className = 'fas fa-microphone';
        voiceBtn.style.color = '#666';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set up initial state
    switchTab('passenger');
    
    // Set initial focus to message input
    setTimeout(() => {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.focus();
        }
    }, 500); // Delay to ensure everything is loaded
    
    // Add initial contextual greeting based on stage
    setTimeout(() => {
        const stageContext = getStageContext(conversationState.journeyStage);
        // Don't send automatic greeting for departure_airport - wait for user to say "I've arrived"
        if (conversationState.journeyStage !== 'departure_airport') {
            addMessage(stageContext.greeting, 'bot');
        }
        
        // For airline route, automatically send the flight details message
        // But only if we're still on the airline route when this executes
        if (conversationState.journeyStage === 'entry_via_airline') {
            setTimeout(() => {
                // Double-check we're still on airline route (user might have switched stages)
                if (conversationState.journeyStage === 'entry_via_airline') {
                    // Calculate date 7 days from today for the flight details
                    const flightDate = new Date();
                    flightDate.setDate(flightDate.getDate() + 7);
                    const formattedDate = flightDate.toLocaleDateString('en-GB', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                    });
                    
                    const followUpMessage = `I see you are travelling to JFK on flight BA 789 departing at 18:20 on ${formattedDate}. Is this correct?`;
                    addMessage(followUpMessage, 'bot');
                }
            }, 1500);
        }
    }, 1000);
    
    // Removed quick start tips to avoid duplicates and reduce noise
    
    // Initialize airport dashboard data so it's ready if user switches tabs
    setTimeout(() => {
        try {
            refreshAirportDashboardSummary();
            renderMeetingView();
            renderAirsideView();
        } catch (e) {
            console.log('Airport view init skipped (elements may not be mounted yet).');
        }
    }, 300);
});

// Airport dashboard subviews and helpers
function switchAirportView(view) {
    const meetingBtn = document.querySelector('.airport-subnav .subnav-button:nth-child(1)');
    const airsideBtn = document.querySelector('.airport-subnav .subnav-button:nth-child(2)');
    const meeting = document.getElementById('meetingView');
    const airside = document.getElementById('airsideView');
    if (!meeting || !airside || !meetingBtn || !airsideBtn) return;
    if (view === 'meeting') {
        meetingBtn.classList.add('active');
        airsideBtn.classList.remove('active');
        meeting.style.display = '';
        airside.style.display = 'none';
        // Ensure list is fresh
        renderMeetingView();
    } else if (view === 'airside') {
        meetingBtn.classList.remove('active');
        airsideBtn.classList.add('active');
        meeting.style.display = 'none';
        airside.style.display = '';
        // Ensure list and banner are fresh
        renderAirsideView();
    } else if (view === 'management') {
        meetingBtn.classList.remove('active');
        airsideBtn.classList.remove('active');
        meeting.style.display = 'none';
        airside.style.display = 'none';
        const mgmt = document.getElementById('managementView');
        const fb = document.getElementById('feedbackView');
        if (mgmt && fb) { mgmt.style.display = ''; fb.style.display = 'none'; }
        renderManagementView();
    } else if (view === 'feedback') {
        meetingBtn.classList.remove('active');
        airsideBtn.classList.remove('active');
        meeting.style.display = 'none';
        airside.style.display = 'none';
        const mgmt = document.getElementById('managementView');
        const fb = document.getElementById('feedbackView');
        if (mgmt && fb) { mgmt.style.display = 'none'; fb.style.display = ''; }
        renderFeedbackView();
    }
}

function getAllPassengersForAirport() {
    const passengers = [];
    // From sample data
    samplePassengers.forEach(p => {
        passengers.push({
            name: p.name,
            flight: p.flight,
            to: p.destination,
            gate: p.gate,
            departure: p.departure,
            needs: p.needs,
            status: p.status,
            hasNewMessage: !!p.hasNewMessage,
            meetingLocation: p.meetingLocation || 'Assistance Desk',
            waitingPreference: p.waitingPreference || 'Standard Assistance Area'
        });
    });
    // From current conversation
    if (conversationState.currentFlight && (conversationState.userName || conversationState.hasProfile)) {
        const f = conversationState.currentFlight;
        passengers.unshift({
            name: conversationState.userName || 'Passenger',
            flight: f.flight,
            to: f.to,
            gate: f.gate || 'TBD',
            departure: f.departure,
            needs: conversationState.accessibilityNeeds || [],
            status: conversationState.confirmedTravel ? 'confirmed' : 'en-route',
            meetingLocation: conversationState.meetingLocation || 'Assistance Desk',
            waitingPreference: conversationState.preferredWaitingArea || 'Assistance Area'
        });
    }
    return passengers;
}

// Airline subviews
function switchAirlineView(view) {
    const boarding = document.getElementById('airlineBoardingView');
    const cabin = document.getElementById('airlineCabinView');
    const mgmt = document.getElementById('airlineMgmtView');
    const fb = document.getElementById('airlineFeedbackView');
    if (!boarding || !cabin || !mgmt || !fb) return;
    boarding.style.display = view === 'boarding' ? '' : 'none';
    cabin.style.display = view === 'cabin' ? '' : 'none';
    mgmt.style.display = view === 'management' ? '' : 'none';
    fb.style.display = view === 'feedback' ? '' : 'none';
    if (view === 'boarding') renderAirlineBoarding();
    if (view === 'cabin') renderAirlineCabin();
    if (view === 'management') renderAirlineMgmt();
    if (view === 'feedback') renderAirlineFeedback();
}

function getAllPassengersForAirline() {
    // Compose from sample + current conversation
    const pax = samplePassengers.map(p => ({
        name: p.name,
        flight: p.flight,
        gate: p.gate,
        departure: p.departure,
        needs: p.needs,
        airlineStatus: p.airlineStatus || 'waiting',
        waitingPreference: p.waitingPreference
    }));
    if (conversationState.currentFlight) {
        pax.unshift({
            name: conversationState.userName || 'Passenger',
            flight: conversationState.currentFlight.flight,
            gate: conversationState.currentFlight.gate || 'TBD',
            departure: conversationState.currentFlight.departure,
            needs: conversationState.accessibilityNeeds || [],
            airlineStatus: 'waiting',
            waitingPreference: conversationState.preferredWaitingArea
        });
    }
    return pax;
}

function renderAirlineBoarding() {
    const list = document.getElementById('airlineBoardingList');
    if (!list) return;
    const pax = getAllPassengersForAirline();
    // Update header KPIs
    const boarded = pax.filter(p => p.airlineStatus === 'boarded').length;
    const statPax = document.getElementById('alStatPax');
    const statBoarded = document.getElementById('alStatBoarded');
    if (statPax) statPax.textContent = String(pax.length);
    if (statBoarded) statBoarded.textContent = String(boarded);
    function chip(status){
        if(status==='boarded') return '<span class="status-chip chip-boarded">Boarded</span>';
        if(status==='waiting') return '<span class="status-chip chip-waiting">Waiting</span>';
        if(status==='pre_security') return '<span class="status-chip chip-presec">Pre-security</span>';
        if(status==='no_show') return '<span class="status-chip chip-noshow">No show</span>';
        return status;
    }
    list.innerHTML = '';
    pax.forEach(p => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${p.name}</div>
            <div>${p.flight}</div>
            <div>${chip(p.airlineStatus)}</div>
            <div>${p.waitingPreference || (p.airlineStatus==='pre_security' ? 'Before security' : '—')}</div>
            <div>${p.gate || 'TBD'}</div>
            <div class="actions">
                <button class="mini-btn primary">Message</button>
                <button class="mini-btn success">Mark Boarded</button>
            </div>
        `;
        list.appendChild(row);
    });
}

function renderAirlineCabin() {
    const brief = document.getElementById('cabinBrief');
    if (!brief) return;
    const pax = getAllPassengersForAirline().slice(0, 4);
    brief.innerHTML = '';
    pax.forEach(p => {
        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `
            <div class="profile-header">
                <div class="profile-name">${p.name}</div>
                <div class="flight-info">${p.flight} • Gate ${p.gate || 'TBD'} • Dep ${p.departure}</div>
            </div>
            <div class="profile-details">
                <div class="detail-row"><strong>Accessibility Needs:</strong><span>${(p.needs||[]).join(', ') || '—'}</span></div>
                <div class="detail-row"><strong>Meeting/Waiting:</strong><span>${p.waitingPreference || 'Assistance Desk'}</span></div>
                <div class="detail-row"><strong>Status:</strong><span>${p.airlineStatus}</span></div>
            </div>
        `;
        brief.appendChild(card);
    });
}

function renderAirlineMgmt() {
    const kpis = document.getElementById('alMgmtKpis');
    if (!kpis) return;
    const pax = getAllPassengersForAirline();
    const boarded = pax.filter(p => p.airlineStatus==='boarded').length;
    const waiting = pax.filter(p => p.airlineStatus==='waiting').length;
    const pre = pax.filter(p => p.airlineStatus==='pre_security').length;
    const noshow = pax.filter(p => p.airlineStatus==='no_show').length;
    kpis.innerHTML = `
        <div class="kpi-card"><div class="kpi-title">Passengers Today</div><div class="kpi-value">${pax.length}</div></div>
        <div class="kpi-card"><div class="kpi-title">Boarded</div><div class="kpi-value">${boarded}</div></div>
        <div class="kpi-card"><div class="kpi-title">Waiting Airside</div><div class="kpi-value">${waiting}</div></div>
        <div class="kpi-card"><div class="kpi-title">Pre-security</div><div class="kpi-value">${pre}</div></div>
        <div class="kpi-card"><div class="kpi-title">No-shows</div><div class="kpi-value">${noshow}</div></div>
    `;
    const mix = document.getElementById('alAssistMix');
    if (mix) {
        const counts = {};
        pax.forEach(p => (p.needs||[]).forEach(n => { counts[n] = (counts[n]||0)+1; }));
        mix.innerHTML = Object.entries(counts).slice(0,6).map(([k,v]) => `
            <div class="bar-item"><div>${k}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, v*15)}%"></div></div></div>
        `).join('');
    }
    const routes = document.getElementById('alRouteRatings');
    if (routes) {
        const data = [{route:'LHR → JFK', val: 4.6},{route:'LHR → LAX', val:4.3},{route:'LHR → MAD', val:4.1}];
        routes.innerHTML = data.map(d => `
            <div class="bar-item"><div>${d.route}</div><div class="bar-track"><div class="bar-fill" style="width:${d.val/5*100}%"></div></div></div>
        `).join('');
    }
}

function renderAirlineFeedback() {
    const list = document.getElementById('alFeedbackList');
    if (!list) return;
    const items = [
        { name:'Greta Müller', flight:'LH 907', ratings:{ boarding:5, inflight:4 }, comment:'Crew were very attentive and knew my needs.', status:'New' },
        { name:'Luis Fernández', flight:'AA 101', ratings:{ boarding:3, inflight:4 }, comment:'Boarding could be quicker with clearer calls.', status:'Acknowledged' }
    ];
    function stars(n){ return '⭐'.repeat(n); }
    list.innerHTML = items.map(it => `
        <div class="table-row">
            <div>${it.name}</div>
            <div>${it.flight}</div>
            <div><span class="rating-badge">Boarding: ${stars(it.ratings.boarding)}</span> <span class="rating-badge">In-flight: ${stars(it.ratings.inflight)}</span></div>
            <div>${it.comment}</div>
            <div>${it.status}</div>
            <div><button class="respond-btn" onclick="alert('Responding to ${it.name}...')">Respond</button></div>
        </div>
    `).join('');
}

function getAirlineCodeFromName(airlineName) {
    const map = {
        'British Airways': 'BA',
        'Virgin Atlantic': 'VS'
    };
    return map[airlineName] || 'BA';
}

function extractAirlineCodeFromFlight(flightCode) {
    if (typeof flightCode !== 'string') return 'BA';
    const m = flightCode.trim().match(/^[A-Z]{2}/i);
    return m ? m[0].toUpperCase() : 'BA';
}

function getTailLogoUrl(airlineCode, width = 64, height = 40) {
    // AirHex tail logo URL (PNG). For production, append md5apikey per docs
    // https://airhex.com/api/logos/
    return `https://content.airhex.com/content/logos/airlines_${airlineCode}_${width}_${height}_t.png?proportions=keep`;
}

// Add utility functions used by Airside rendering
function addMinutesToTime(hhmm, minsToAdd) {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    d.setMinutes(d.getMinutes() + minsToAdd);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function computeMeetInfoFor(departureHHMM, meetingLocation) {
    const [depHour, depMin] = (departureHHMM || '18:20').split(':').map(Number);
    const departureDate = new Date();
    departureDate.setHours(depHour, depMin, 0, 0);
    const minutesBefore = 45;
    const meetDate = new Date(departureDate.getTime() - minutesBefore * 60000);
    const meetTime = meetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const location = (meetingLocation || '').toLowerCase();
    let walkMinutes = 8;
    if (location.includes('disabled parking')) walkMinutes = 12;
    if (location.includes('heathrow express')) walkMinutes = 10;
    if (location.includes('drop off')) walkMinutes = 9;
    if (location.includes('restaurant') || location.includes('bar') || location.includes('relaxation')) walkMinutes = 10;
    return { meetTime, minutesBefore, walkMinutes };
}

function renderMeetingView() {
    const container = document.getElementById('meetingList');
    if (!container) return;
    const passengers = getAllPassengersForAirport();
    container.innerHTML = '';
    passengers.forEach(p => {
        const airlineCode = extractAirlineCodeFromFlight(p.flight);
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <img class="airline-logo" alt="${airlineCode}" src="${getTailLogoUrl(airlineCode, 54, 36)}"/>
                    <div>
                        <div style="font-weight:600; color:#1e293b;">${p.name}</div>
                        <div style="color:#64748b; font-size:12px;">${p.to}</div>
                    </div>
                </div>
            </div>
            <div>${p.flight}</div>
            <div>${p.meetingLocation || 'Assistance Desk'}</div>
            <div>${(p.needs || []).map(n => `<span class="need-tag">${n}</span>`).join(' ')}</div>
            <div>
                <span class="status-dot">
                    <span class="dot ${p.status === 'confirmed' ? 'ok' : p.status === 'no-show' ? 'alert' : 'wait'}"></span>
                    ${p.status === 'confirmed' ? 'Confirmed' : p.status === 'no-show' ? 'No Show' : 'Awaiting'}
                </span>
            </div>
            <div class="actions">
                <button class="mini-btn primary" onclick="contactPassenger('${p.name}')">Contact</button>
                <button class="mini-btn success">Mark Met</button>
                <button class="mini-btn warn">No Show</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function renderAirsideView() {
    const container = document.getElementById('airsideList');
    if (!container) return;
    const passengers = getAllPassengersForAirport();
    // Notifications
    const notice = document.getElementById('airsideNotifications');
    if (notice) {
        const msgPax = passengers.find(p => p.hasNewMessage);
        if (msgPax) {
            notice.innerHTML = `<div class="notice-banner"><i class="fas fa-message"></i> <strong>${msgPax.name}</strong> sent a new message. <span class="badge msg">Unread</span></div>`;
        } else {
            notice.innerHTML = '';
        }
    }
    container.innerHTML = '';
    passengers.forEach(p => {
        // Simulate a delay flag for one passenger (e.g., DL 44) by adding 30 minutes to their departure
        const isDelayed = /DL\s?44/i.test(p.flight);
        const newDeparture = isDelayed ? addMinutesToTime(p.departure, 30) : p.departure;
        const info = computeMeetInfoFor(newDeparture, p.meetingLocation);
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${p.name}</div>
            <div>${p.waitingPreference || 'Assistance Area'}</div>
            <div>${p.gate || 'TBD'} ${isDelayed ? '<span class="badge delay">Delay</span>' : ''}</div>
            <div>${info.meetTime} ${isDelayed ? `<span class=\"badge time\">New dep ${newDeparture}</span>` : ''}</div>
            <div>${info.walkMinutes} min</div>
            <div class="actions">
                <button class="mini-btn primary" onclick="contactPassenger('${p.name}')">Contact</button>
                <button class="mini-btn success">On My Way</button>
                <button class="mini-btn">Directions</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function refreshAirportDashboardSummary() {
    const passengers = getAllPassengersForAirport();
    const active = document.getElementById('statActivePassengers');
    const confirmed = document.getElementById('statConfirmed');
    const avg = document.getElementById('statAvgRating');
    if (active) active.textContent = String(passengers.length);
    if (confirmed) confirmed.textContent = String(passengers.filter(p => p.status === 'confirmed').length);
    if (avg) avg.textContent = '4.2';
}

// Management view rendering
function renderManagementView() {
    const kpis = document.getElementById('mgmtKpis');
    if (kpis) {
        const pax = getAllPassengersForAirport();
        const confirmed = pax.filter(p => p.status === 'confirmed').length;
        const awaiting = pax.filter(p => p.status === 'awaiting' || p.status === 'en-route').length;
        const noShows = pax.filter(p => p.status === 'no-show').length;
        kpis.innerHTML = `
            <div class="kpi-card"><div class="kpi-title">Passengers Today</div><div class="kpi-value">${pax.length}</div></div>
            <div class="kpi-card"><div class="kpi-title">Confirmed Arrivals</div><div class="kpi-value">${confirmed}</div></div>
            <div class="kpi-card"><div class="kpi-title">Awaiting/En-route</div><div class="kpi-value">${awaiting}</div></div>
            <div class="kpi-card"><div class="kpi-title">No Shows</div><div class="kpi-value">${noShows}</div></div>
        `;
    }
    const mix = document.getElementById('assistMix');
    if (mix) {
        const counts = { Wheelchair: 0, 'Priority Boarding': 0, 'Hearing Support': 0, 'Visual Impairment': 0, 'Cognitive support': 0 };
        getAllPassengersForAirport().forEach(p => (p.needs || []).forEach(n => {
            const key = Object.keys(counts).find(k => n.toLowerCase().includes(k.toLowerCase()));
            if (key) counts[key] += 1;
        }));
        mix.innerHTML = Object.entries(counts).map(([k,v]) => `
            <div class="bar-item">
                <div>${k}</div>
                <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, v*20)}%"></div></div>
            </div>
        `).join('');
    }
    const flow = document.getElementById('hourlyFlow');
    if (flow) {
        const hours = ['10:00','11:00','12:00','13:00','14:00','15:00'];
        flow.innerHTML = hours.map(h => {
            const val = Math.floor(3 + Math.random()*6);
            return `<div class="bar-item"><div>${h}</div><div class="bar-track"><div class="bar-fill" style="width:${val*10}%"></div></div></div>`;
        }).join('');
    }
    const gauge = document.getElementById('slaGauge');
    if (gauge) {
        const sla = 88 + Math.floor(Math.random()*8); // % on-time to meet
        gauge.textContent = `${sla}% on-time to meet`;
    }
    const risks = document.getElementById('riskFlags');
    if (risks) {
        risks.innerHTML = `
            <li class="risk-item"><i class="fas fa-triangle-exclamation"></i> 2 passengers with missing meeting point</li>
            <li class="risk-item"><i class="fas fa-triangle-exclamation"></i> 1 delayed departure affecting meet time</li>
            <li class="risk-item"><i class="fas fa-triangle-exclamation"></i> 1 no-show in last hour</li>
        `;
    }
}

// Feedback view rendering
function renderFeedbackView() {
    const list = document.getElementById('feedbackList');
    if (!list) return;
    // Sample feedback items
    const items = [
        { name: 'Sarah Johnson', flight: 'BA 123', ratings: { arrival: 5, security: 4, preflight: 5 }, comment: 'Team were fantastic meeting us at disabled parking.', status: 'New' },
        { name: 'Michael Chen', flight: 'VS 456', ratings: { arrival: 4, security: 3, preflight: 4 }, comment: 'Would love clearer visual signage.', status: 'Acknowledged' },
        { name: 'Amelia Clarke', flight: 'DL 44', ratings: { arrival: 2, security: 3, preflight: 3 }, comment: 'We struggled to find the meeting point.', status: 'Responded' },
    ];
    function stars(n){ return '⭐'.repeat(n); }
    list.innerHTML = '';
    items.forEach(it => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${it.name}</div>
            <div>${it.flight}</div>
            <div><span class="rating-badge">Arrival: ${stars(it.ratings.arrival)}</span> <span class="rating-badge">Security: ${stars(it.ratings.security)}</span> <span class="rating-badge">Pre-flight: ${stars(it.ratings.preflight)}</span></div>
            <div>${it.comment}</div>
            <div>${it.status}</div>
            <div><button class="respond-btn" onclick="alert('Responding to ${it.name}...')">Respond</button></div>
        `;
        list.appendChild(row);
    });
}

// Utility functions for dashboard interactions
function updateStats() {
    // This would be called when new data comes in
    // For demo purposes, we'll just simulate some updates
}

function refreshDashboard() {
    // Simulate real-time updates
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const currentValue = parseInt(stat.textContent);
        const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const newValue = Math.max(0, currentValue + variation);
        stat.textContent = newValue;
    });
}

// Simulate real-time updates every 30 seconds
setInterval(refreshDashboard, 30000);

// Utility: compute meet time and walk duration for pre-flight
function getPreFlightMeetInfo() {
    // Defaults; in a real app, these would be dynamic per venue and gate distance
    const departure = conversationState.currentFlight?.departure || '18:20';
    const [depHour, depMin] = departure.split(':').map(Number);
    const departureDate = new Date();
    departureDate.setHours(depHour, depMin, 0, 0);
    
    // Meet 45 minutes before departure by default
    const minutesBefore = 45;
    const meetDate = new Date(departureDate.getTime() - minutesBefore * 60000);
    const meetTime = meetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Walk time heuristic based on meeting location
    const location = (conversationState.meetingLocation || '').toLowerCase();
    let walkMinutes = 8; // default from Assistance Desk
    if (location.includes('disabled parking')) walkMinutes = 12;
    if (location.includes('heathrow express')) walkMinutes = 10;
    if (location.includes('drop off')) walkMinutes = 9;
    if (location.includes('restaurant') || location.includes('bar') || location.includes('relaxation')) walkMinutes = 10;
    
    return { meetTime, minutesBefore, walkMinutes };
}

// Utility: compute meet info and time math used per-passenger in Airside
// Added above as computeMeetInfoFor and addMinutesToTime

// Centralized function to send pre-board brief and reminder messages
function sendPreBoardBriefAndReminder() {
    console.log('sendPreBoardBriefAndReminder called, preFlightReminderScheduled:', conversationState.preFlightReminderScheduled);
    
    if (conversationState.preFlightReminderScheduled) {
        console.log('Already scheduled, returning early');
        return; // Already sent, don't duplicate
    }
    
    conversationState.preFlightStep = 'complete';
    conversationState.preFlightReminderScheduled = true;
    
    const meetInfo = getPreFlightMeetInfo();
    console.log('Sending pre-board brief...');
    
    // Send the pre-board brief immediately
    addMessage(`Pre-boarding brief:

• Meet time: ${meetInfo.meetTime}
• Walk time to gate: ${meetInfo.walkMinutes} minutes
• If anything changes, just message "help" and I'll update the team

I'll be here if you need me — enjoy your time and I'll prompt you when it's time to go.`, 'bot');
    
    // Then send the consecutive time passes and reminder messages
    setTimeout(() => {
        console.log('Sending time passes message...');
        addMessage('(time passes...)', 'bot');
    }, 200);
    
    setTimeout(() => {
        console.log('Sending reminder message...');
        const info = getPreFlightMeetInfo();
        const meetingPlace = conversationState.meetingLocation || 'the Assistance Desk';
        addMessage(`⏳ Reminder: Mark will come to meet you in 15 minutes at ${meetingPlace} (${info.meetTime}). Please settle your bill and be ready. If you need help, type "help".`, 'bot');
    }, 400);
}