// Portfolio context for AI assistant
// Kevin Jiang's portfolio data

// Type for simplified project data used in featured sections
export interface PortfolioProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  category: string;
  github?: string;
  featured: boolean;
}

export const PORTFOLIO_DATA = {
  personal: {
    name: 'Kevin Jiang',
    title: 'The Everything Engineer',
    location: 'Waterloo, Ontario, Canada',
    email: 'k69jiang@uwaterloo.ca',
    github: 'https://github.com/ANonABento',
    linkedin: 'https://linkedin.com/in/ANonABento',
    university: 'University of Waterloo',
    degree: 'BASc in Computer Engineering',
  },

  about: `I'm a Computer Engineering student at the University of Waterloo with a passion for building robots that interact naturally with humans. My work spans the full stack of robotics—from designing custom PCBs and 3D-printed mechanisms to implementing GPU-accelerated AI pipelines with LLMs and computer vision.

I've built everything from gesture-controlled robot arms using AR glasses to expressive robot heads that can hold conversations. When I'm not soldering or debugging ROS2 nodes, you'll find me competing at hackathons or tinkering with new sensor technologies.`,

  skills: {
    hardware: [
      'STM32 & ESP32',
      'PCB Design (Altium)',
      'Arduino & Microcontrollers',
      '3D Printing & CAD',
      'Soldering & Assembly',
      'Servo & Motor Control',
      'Sensor Integration',
    ],
    software: [
      'Python',
      'C / C++',
      'JavaScript / TypeScript',
      'ROS2',
      'PyTorch',
      'OpenCV',
      'React & Next.js',
      'Three.js / WebGL',
    ],
    tools: [
      'Fusion 360',
      'OnShape',
      'Blender',
      'Docker',
      'Git & GitHub',
      'Linux',
      'Jetson Nano',
      'llama.cpp / Whisper',
    ],
  },

  projects: [
    {
      id: 'robotic-arm',
      name: 'Robotic Arm Puppeteer',
      description: 'Python + ROS2 control and calibration toolkit for the OpenArm robotic platform. Supports reading wrist joint positions, calibrating motion ranges, and integrates seamlessly with ROS2 for robotic simulation and control. Features multi-camera AprilTag perception with covariance-based accuracy filtering.',
      technologies: ['Python', 'ROS2', 'OpenCV', 'Fusion 360', 'Dynamixel', 'AprilTag'],
      category: 'Robotics',
      github: 'https://github.com/ANonABento',
      featured: true,
    },
    {
      id: 'robot-head',
      name: 'Expressive AI Robot Head',
      description: 'ROS2-based robotic head integrating LLMs, speech recognition, vision, and servo control for human-like interactions. Features GPU-accelerated CUDA pipeline, 12-servo organic mesh design, and real-time speech workflow using Whisper and llama.cpp.',
      technologies: ['Python', 'PyTorch', 'llama.cpp', 'Whisper', 'ESP32', 'FreeRTOS', 'Blender'],
      category: 'AI & Robotics',
      github: 'https://github.com/ANonABento',
      featured: true,
    },
    {
      id: 'ar-robot',
      name: 'AR Gesture Controlled Robot',
      description: 'Modular robot platform controlled through Snap Spectacles AR glasses. End-to-end gesture-to-motion pipeline using Snap API, Flask, HiveMQ MQTT, and ROS2. Sub-100ms latency with NVIDIA Jetson Nano for on-device AI inference.',
      technologies: ['JavaScript', 'Python', 'Jetson Nano', 'Docker', 'MQTT', 'ROS2'],
      category: 'Robotics',
      github: 'https://github.com/ANonABento',
      featured: true,
    },
    {
      id: 'keyboard',
      name: 'One Handed Keyboard',
      description: 'AAC device featuring a wrist-mounted keyboard with only 5 GPIO buttons. Uses trie and fuzzy search algorithms for predictive text. 3D-printed housing with STM32 microcontroller. Received 99% grade with comprehensive documentation.',
      technologies: ['C', 'STM32', 'FSM', 'OnShape', '3D-Printing', 'UART'],
      category: 'Accessibility',
      github: 'https://github.com/ANonABento',
      featured: false,
    },
    {
      id: 'vr-gloves',
      name: 'VR Haptic Gloves',
      description: 'ESP32-based haptic feedback gloves for VR with spring-loaded potentiometers and servo-assisted haptics. 3D-printed custom mounts for precise finger tracking. Designed for sub-100ms sensory resistance in VR applications.',
      technologies: ['C++', 'ESP32', 'Arduino', '3D-Printing', 'Cura'],
      category: 'VR/AR',
      github: 'https://github.com/ANonABento',
      featured: false,
    },
    {
      id: 'robotics-ftc',
      name: 'FIRST Tech Challenge Robot',
      description: 'Lead builder and programmer for team Devolotics at FIRST Tech Challenge World Championship. Built rubber band tensioned drone launcher, autonomous program using splines, and multiple CAD-designed mechanisms with machined aluminum and 3D-printed components.',
      technologies: ['Java', 'OpenCV', 'OnShape', '3D-Printing', 'Motor Control'],
      category: 'Competition',
      github: 'https://github.com/ANonABento',
      featured: false,
    },
    {
      id: 'game-dev',
      name: 'Unity Game Development',
      description: 'Best Overall winner at UWGDC Game Jam Fall 2024. Developed complex game logic using C# scripting in Unity with physics, colliders, and AI. Utilized finite state machines for smooth animation transitions.',
      technologies: ['C#', 'Unity', 'Blender', 'OpenCV', 'FSM'],
      category: 'Games',
      featured: false,
    },
  ],

  experience: [
    {
      id: 'hamming',
      company: 'Hamming AI',
      role: 'Software Engineer',
      location: 'Austin, Texas, United States',
      period: 'Dec 2025 - Present',
      description: 'YC S24 startup building AI-powered developer tools.',
      type: 'work' as const,
      technologies: ['Python', 'AI/ML', 'Full Stack'],
    },
    {
      id: 'reazon',
      company: 'Reazon Human Interaction Lab',
      role: 'Robotics Engineer',
      location: 'Akihabara, Tokyo, Japan',
      period: 'Jun 2025 - Aug 2025',
      description: 'Designed lightweight exoskeleton wrist controller with Dynamixel actuators. Built multi-camera AprilTag tracking system with 20% accuracy improvement. Developed interactive Three.js web interface for remote calibration.',
      type: 'work' as const,
      technologies: ['Python', 'ROS2', 'Fusion 360', 'Three.js', 'OpenCV'],
    },
    {
      id: 'midnight-sun',
      company: 'Midnight Sun',
      role: 'Hardware Developer',
      location: 'Waterloo, Ontario, Canada',
      period: 'Sep 2024 - Apr 2025',
      description: 'Designed and routed double-layer PCBs for controller subsystem. Maintained 0 ERC/DRC violations across all layers. Soldered and tested multiple SMD boards including IMU and power control circuits.',
      type: 'work' as const,
      technologies: ['Altium Designer', 'PCB Design', 'Soldering', 'Oscilloscope'],
    },
    {
      id: 'zenith',
      company: 'Zenith Energy Corporation',
      role: 'Front-End Developer',
      location: 'Toronto, Ontario, Canada',
      period: 'Sep 2022 - Jan 2023',
      description: 'Developed and deployed client-facing e-commerce sites on Wix and Shopify. Reduced handover time with modular templates and simplified CMS workflows. Created cohesive brand identity with custom graphics.',
      type: 'work' as const,
      technologies: ['JavaScript', 'Shopify', 'Wix', 'Adobe Photoshop'],
    },
  ],

  education: [
    {
      id: 'uwaterloo',
      institution: 'University of Waterloo',
      degree: 'BASc in Computer Engineering',
      period: 'Sept 2024 - Present',
      location: 'Waterloo, Ontario, Canada',
    },
  ],
};

export const SYSTEM_PROMPT = `You are the AI assistant for ${PORTFOLIO_DATA.personal.name}'s portfolio website.

## Your Personality
- Friendly, knowledgeable, and genuinely excited about robotics and engineering
- Speaks like a fellow engineer—technical but approachable
- Humble about achievements but eager to share technical details
- Occasionally uses relevant emoji for warmth (but don't overdo it)

## About ${PORTFOLIO_DATA.personal.name}
${PORTFOLIO_DATA.about}

Currently studying ${PORTFOLIO_DATA.personal.degree} at ${PORTFOLIO_DATA.personal.university}.

## Skills

### Hardware
${PORTFOLIO_DATA.skills.hardware.map(s => `- ${s}`).join('\n')}

### Software
${PORTFOLIO_DATA.skills.software.map(s => `- ${s}`).join('\n')}

### Tools
${PORTFOLIO_DATA.skills.tools.map(s => `- ${s}`).join('\n')}

## Featured Projects
${PORTFOLIO_DATA.projects.filter(p => p.featured).map(p => `
### ${p.name}
${p.description}
Technologies: ${p.technologies.join(', ')}
`).join('\n')}

## Work Experience
${PORTFOLIO_DATA.experience.map(e => `
### ${e.role} at ${e.company} (${e.period})
${e.description}
`).join('\n')}

## Education
${PORTFOLIO_DATA.education.map(e => `
- ${e.degree} at ${e.institution} (${e.period})
`).join('\n')}

## Contact Information
- Email: ${PORTFOLIO_DATA.personal.email}
- GitHub: ${PORTFOLIO_DATA.personal.github}
- LinkedIn: ${PORTFOLIO_DATA.personal.linkedin}

## Response Guidelines
1. Keep responses concise (2-4 sentences for simple questions, more for technical deep-dives)
2. Use markdown formatting naturally (bold for emphasis, code blocks for technical terms)
3. When discussing projects, share specific technical details and challenges overcome
4. Suggest follow-up questions when appropriate (e.g., "Want to know about the ROS2 integration?")
5. If asked something you don't know, admit it gracefully and offer related info
6. For technical questions, include brief explanations or examples
7. Be enthusiastic about robotics and embedded systems—it's genuinely exciting stuff!

## Example Tones
- Good: "The robot head uses llama.cpp for local LLM inference—keeps latency under 200ms for real-time conversations!"
- Good: "Great question! The AprilTag tracking uses covariance-based filtering to improve accuracy by ~20%."
- Avoid: "I am an AI assistant. I can help you with..."
- Avoid: Overly formal or robotic responses (ironic for a robotics portfolio!)

Remember: You're representing Kevin's work in robotics and embedded systems. Be genuine, technical, and helpful!`;

// Generate dynamic suggested questions from portfolio data
function generateSuggestedQuestions(): string[] {
  const questions: string[] = [];

  // Add questions about featured projects
  const featured = PORTFOLIO_DATA.projects.filter(p => p.featured);
  if (featured.length > 0) {
    const project = featured[0];
    questions.push(`Tell me about ${project.name}`);
  }
  if (featured.length > 1) {
    const project = featured[1];
    questions.push(`How does ${project.name} work?`);
  }

  // Add a general experience question
  questions.push("What's your robotics experience?");

  // Add a technology question based on top skills
  const topTech = PORTFOLIO_DATA.skills.hardware[0];
  if (topTech) {
    questions.push(`Tell me about your ${topTech} projects`);
  }

  return questions.slice(0, 4); // Limit to 4 questions
}

// Suggested questions for the chat interface
export const SUGGESTED_QUESTIONS = generateSuggestedQuestions();
