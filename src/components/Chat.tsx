'use client';

import { useState } from 'react';

const data = {
  about: 'Hardware and software engineer passionate about robotics and web development. I specialize in building innovative solutions that bridge the physical and digital worlds.',
  projects: [
    { name: 'Robot Arm', description: 'Hardware project for automated picking system using Arduino.' },
    { name: 'Game App', description: 'Software game built with Unity for adventure experiences.' },
  ],
  contact: 'Email: your@email.com | LinkedIn: linkedin.com/in/yourprofile',
};

export default function Chatbot() {
  const [messages, setMessages] = useState<string[]>(['Hello! Click a button or type a message.']);
  const [input, setInput] = useState('');

  const handleButton = (type: string) => {
    let response = '';
    if (type === 'about') response = data.about;
    else if (type === 'projects') response = data.projects.map(p => `${p.name}: ${p.description}`).join('\n');
    else if (type === 'contact') response = data.contact;

    setMessages([...messages, `Bot: ${response}`]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, `You: ${input}`];
    let response = 'I don\'t understand. Try the buttons or ask about about, projects, or contact.';

    if (input.toLowerCase().includes('about')) response = data.about;
    else if (input.toLowerCase().includes('project')) response = data.projects.map(p => `${p.name}: ${p.description}`).join('\n');
    else if (input.toLowerCase().includes('contact')) response = data.contact;

    setMessages([...newMessages, `Bot: ${response}`]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full p-4 bg-gray-900">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg, i) => (
          <p key={i} className="mb-2 text-gray-200">{msg}</p>
        ))}
      </div>
      <div className="mb-4 flex space-x-2">
        <button onClick={() => handleButton('about')} className="bg-gray-700 text-white px-4 py-2 hover:bg-gray-600">About Me</button>
        <button onClick={() => handleButton('projects')} className="bg-gray-700 text-white px-4 py-2 hover:bg-gray-600">Projects</button>
        <button onClick={() => handleButton('contact')} className="bg-gray-700 text-white px-4 py-2 hover:bg-gray-600">Contact</button>
      </div>
      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-gray-800 text-gray-200 border border-gray-600 p-2"
          placeholder="Type your message..."
        />
        <button onClick={handleSend} className="ml-2 bg-gray-700 text-white px-4 py-2 hover:bg-gray-600">Send</button>
      </div>
    </div>
  );
}