import React, { useState, useRef, useEffect } from 'react';
import styles from './VoiceChat.module.css';

const VoiceChat = () => {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  
  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Try Chrome or Edge.');
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    
    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text: transcript, 
        sender: 'user' 
      }]);
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
      
      if (event.error === 'network') {
        setError('Network error. Please check your connection and try again.');
        
        // Wait 3 seconds and ensure recognition is available
        setTimeout(() => {
          if (recognitionRef.current && !isRecording) {
            recognitionRef.current.start();
            setIsRecording(true);
          }
        }, 3000);
      } else if (event.error === 'aborted') {
        setError('Speech recognition aborted. Try again.');
      } else {
        setError(`Speech error: ${event.error}`);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      }
    } catch (err) {
      console.error('Microphone permission error:', err);
      setError('Microphone permission denied. Please enable microphone access.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    // Simulate AI response
    setIsSpeaking(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text: 'This is a sample AI response', 
        sender: 'ai' 
      }]);
      setIsSpeaking(false);
    }, 1500);
  };

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      <div className={styles.chatWindow}>
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`${styles.message} ${
              message.sender === 'user' ? styles.userMessage : styles.aiMessage
            }`}
          >
            {message.text}
            {message.sender === 'ai' && (
              <button className={styles.playButton}>▶️</button>
            )}
          </div>
        ))}
        
        {isSpeaking && (
          <div className={`${styles.message} ${styles.aiMessage}`}>
            <div className={styles.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.inputBar}>
        {isRecording && (
          <div className={styles.waveform}>
            <div className={styles.wave}></div>
            <div className={styles.wave}></div>
            <div className={styles.wave}></div>
          </div>
        )}
        
        <input 
          type="text" 
          placeholder="Type your message..." 
          className={styles.textInput}
        />
        <button 
          className={`${styles.micButton} ${isRecording ? styles.recording : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          🎤
        </button>
        <button className={styles.sendButton} onClick={handleSend}>
          ➤
        </button>
      </div>
    </div>
  );
};

export default VoiceChat;
