// Portfolio context for AI assistant
// Update this file with your actual information

export const PORTFOLIO_DATA = {
  personal: {
    name: 'Bob',
    title: 'Hardware & Software Engineer',
    location: 'Your Location',
    email: 'your@email.com',
    github: 'https://github.com/yourusername',
    linkedin: 'https://linkedin.com/in/yourprofile',
  },

  about: `I am a passionate hardware and software engineer who specializes in building innovative solutions that bridge the physical and digital worlds. With experience in robotics, embedded systems, and web development, I enjoy tackling complex challenges and creating seamless user experiences.

My approach combines hands-on hardware expertise with modern software development practices, allowing me to deliver end-to-end solutions from circuit design to user interface.`,

  skills: {
    hardware: [
      'Arduino & Microcontrollers',
      'Circuit Design & PCB Layout',
      'Robotics & Automation',
      '3D Printing & CAD',
      'Sensors & Actuators',
    ],
    software: [
      'TypeScript / JavaScript',
      'React & Next.js',
      'Node.js',
      'Python',
      'Three.js / WebGL',
    ],
    tools: [
      'Git & GitHub',
      'Docker',
      'VS Code',
      'Figma',
      'SolidWorks / Fusion 360',
    ],
  },

  projects: [
    {
      name: 'Robot Arm',
      description: 'A hardware project featuring an automated picking system using Arduino. The robot arm can be programmed to perform precise movements and is capable of sorting objects by color and size.',
      technologies: ['Arduino', 'C++', 'Servo Motors', '3D Printed Parts'],
      status: 'Completed',
    },
    {
      name: 'Game App',
      description: 'An adventure game built with Unity featuring immersive gameplay and custom mechanics. Includes procedurally generated levels and a dynamic difficulty system.',
      technologies: ['Unity', 'C#', 'Blender', 'Photoshop'],
      status: 'Completed',
    },
    // Add more projects here
  ],

  experience: [
    // Add your work experience here
    // {
    //   company: 'Company Name',
    //   role: 'Your Role',
    //   period: '2022 - Present',
    //   description: 'What you did there...',
    // },
  ],

  education: [
    // Add your education here
    // {
    //   institution: 'University Name',
    //   degree: 'Your Degree',
    //   period: '2018 - 2022',
    // },
  ],
};

export const SYSTEM_PROMPT = `You are a friendly and professional AI assistant for ${PORTFOLIO_DATA.personal.name}'s portfolio website. Your role is to help visitors learn about their background, skills, projects, and how to get in touch.

## About ${PORTFOLIO_DATA.personal.name}
${PORTFOLIO_DATA.about}

## Skills

### Hardware
${PORTFOLIO_DATA.skills.hardware.map(s => `- ${s}`).join('\n')}

### Software
${PORTFOLIO_DATA.skills.software.map(s => `- ${s}`).join('\n')}

### Tools
${PORTFOLIO_DATA.skills.tools.map(s => `- ${s}`).join('\n')}

## Projects
${PORTFOLIO_DATA.projects.map(p => `
### ${p.name}
${p.description}
Technologies: ${p.technologies.join(', ')}
Status: ${p.status}
`).join('\n')}

## Contact Information
- Email: ${PORTFOLIO_DATA.personal.email}
- GitHub: ${PORTFOLIO_DATA.personal.github}
- LinkedIn: ${PORTFOLIO_DATA.personal.linkedin}

## Guidelines for responses
1. Be helpful, friendly, and professional
2. Keep responses concise but informative (2-4 sentences for simple questions)
3. When asked about projects, provide specific details and technologies used
4. For contact inquiries, always provide the email address
5. If asked something outside the portfolio context, politely redirect to portfolio-related topics
6. Use a conversational tone that reflects the personality of a tech professional
7. If you don't have specific information, acknowledge it and offer to help with what you do know
8. Encourage visitors to explore the 3D viewer and ask questions about the projects

Remember: You represent ${PORTFOLIO_DATA.personal.name}'s professional image. Be enthusiastic about their work while remaining authentic and approachable.`;

// Suggested questions for the chat interface
export const SUGGESTED_QUESTIONS = [
  "What are your main skills?",
  "Tell me about your projects",
  "How can I contact you?",
  "What technologies do you work with?",
];
