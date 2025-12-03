
import React, { useState, useEffect } from 'react';
import { BroadcastMessage } from '../../types';

interface BroadcastBannerProps {
    message: BroadcastMessage;
}

const BroadcastBanner: React.FC<BroadcastBannerProps> = ({ message }) => {
    const SEEN_MESSAGES_KEY = 'seenBroadcastMessages';
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        try {
            const seenMessages: number[] = JSON.parse(localStorage.getItem(SEEN_MESSAGES_KEY) || '[]');
            if (!seenMessages.includes(message.id)) {
                setIsVisible(true);
            }
        } catch (error) {
            console.error("Failed to read broadcast status from localStorage:", error);
            setIsVisible(true); // Fail open to ensure user sees the message
        }
    }, [message]);

    const handleDismiss = () => {
        try {
            const seenMessages: number[] = JSON.parse(localStorage.getItem(SEEN_MESSAGES_KEY) || '[]');
            if (!seenMessages.includes(message.id)) {
                seenMessages.push(message.id);
                localStorage.setItem(SEEN_MESSAGES_KEY, JSON.stringify(seenMessages));
            }
        } catch (error) {
            console.error("Failed to save broadcast status to localStorage:", error);
        } finally {
            setIsVisible(false);
        }
    };
    
    if (!isVisible) return null;

    return (
        <div className="bg-indigo-600 text-white text-sm font-semibold p-3 text-center flex justify-center items-center relative animate-fade-in">
            <i className="fas fa-bullhorn mr-3"></i>
            <span>{message.content}</span>
            <button onClick={handleDismiss} className="absolute right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full w-6 h-6 flex items-center justify-center transition-colors">
                <i className="fas fa-times text-xs"></i>
            </button>
        </div>
    );
};

export default BroadcastBanner;
