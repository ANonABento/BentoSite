// Projects Data - Kevin Jiang's portfolio projects
// Used by ProjectsModal for the portfolio showcase

export type ProjectCategory = 'Robotics' | 'AI & ML' | 'Hardware' | 'Software' | 'VR/AR' | 'Competition';
export type ProjectStatus = 'Completed' | 'In Progress' | 'Archived';

export interface Project {
  id: string;
  name: string;
  shortDescription: string;
  category: ProjectCategory;
  status: ProjectStatus;
  technologies: string[];
  thumbnail?: string;
  links: {
    liveDemo?: string;
    github?: string;
    modelPath?: string;
    docs?: string;
  };
  featured?: boolean;
  dateCompleted?: string;
}

export const PROJECTS: Project[] = [
  {
    id: 'robotic-arm-puppeteer',
    name: 'Robotic Arm Puppeteer',
    shortDescription: 'Python + ROS2 control and calibration toolkit for the OpenArm robotic platform with multi-camera AprilTag perception and 20% improved accuracy.',
    category: 'Robotics',
    status: 'Completed',
    technologies: ['Python', 'ROS2', 'OpenCV', 'Fusion 360', 'Dynamixel', 'AprilTag', 'Three.js'],
    links: {
      github: 'https://github.com/ANonABento',
      modelPath: '/models/placeholder.stl',
    },
    featured: true,
    dateCompleted: '2025-08',
  },
  {
    id: 'expressive-ai-robot-head',
    name: 'Expressive AI Robot Head',
    shortDescription: 'ROS2-based robotic head with LLM integration, speech recognition, and 12-servo organic mesh design for human-like interactions.',
    category: 'AI & ML',
    status: 'Completed',
    technologies: ['Python', 'PyTorch', 'llama.cpp', 'Whisper', 'ESP32', 'FreeRTOS', 'Blender', 'ROS2'],
    links: {
      github: 'https://github.com/ANonABento',
    },
    featured: true,
    dateCompleted: '2025-06',
  },
  {
    id: 'ar-gesture-robot',
    name: 'AR Gesture Controlled Robot',
    shortDescription: 'Modular robot platform controlled through Snap Spectacles AR glasses with sub-100ms latency gesture-to-motion pipeline.',
    category: 'VR/AR',
    status: 'Completed',
    technologies: ['JavaScript', 'Python', 'Jetson Nano', 'Docker', 'MQTT', 'ROS2', 'Flask'],
    links: {
      github: 'https://github.com/ANonABento',
    },
    featured: true,
    dateCompleted: '2025-04',
  },
  {
    id: 'one-handed-keyboard',
    name: 'One Handed Keyboard',
    shortDescription: 'AAC wrist-mounted keyboard device with only 5 GPIO buttons, trie-based predictive text, and fuzzy search. Received 99% grade.',
    category: 'Hardware',
    status: 'Completed',
    technologies: ['C', 'STM32', 'FSM', 'OnShape', '3D-Printing', 'UART'],
    links: {
      github: 'https://github.com/ANonABento',
      docs: 'https://docs.google.com/document/d/example',
    },
    featured: false,
    dateCompleted: '2024-12',
  },
  {
    id: 'vr-haptic-gloves',
    name: 'VR Haptic Gloves',
    shortDescription: 'ESP32-based haptic feedback gloves for VR with spring-loaded potentiometers and servo-assisted haptics for precise finger tracking.',
    category: 'VR/AR',
    status: 'Completed',
    technologies: ['C++', 'ESP32', 'Arduino', '3D-Printing', 'Cura', 'Soldering'],
    links: {
      github: 'https://github.com/ANonABento',
      docs: 'https://docs.google.com/document/d/example',
    },
    featured: false,
    dateCompleted: '2024-10',
  },
  {
    id: 'ftc-robotics',
    name: 'FIRST Tech Challenge Robot',
    shortDescription: 'Lead builder and programmer for team Devolotics at World Championship. Built drone launcher, autonomous program, and CAD mechanisms.',
    category: 'Competition',
    status: 'Completed',
    technologies: ['Java', 'OpenCV', 'OnShape', '3D-Printing', 'Motor Control', 'Mecanum Drive'],
    links: {
      github: 'https://github.com/ANonABento',
    },
    featured: false,
    dateCompleted: '2024-04',
  },
  {
    id: 'pcb-design',
    name: 'PCB Design & Assembly',
    shortDescription: 'Double-layer PCBs for controller subsystems with 0 ERC/DRC violations. Soldered SMD boards including IMU and power control circuits.',
    category: 'Hardware',
    status: 'Completed',
    technologies: ['Altium Designer', 'Oscilloscope', 'Soldering', 'SMD Assembly'],
    links: {
      github: 'https://github.com/ANonABento',
    },
    featured: false,
    dateCompleted: '2025-04',
  },
  {
    id: 'unity-game-dev',
    name: 'Unity Game Development',
    shortDescription: 'Best Overall winner at UWGDC Game Jam Fall 2024. Complex game logic with physics, colliders, AI, and finite state machines.',
    category: 'Software',
    status: 'Completed',
    technologies: ['C#', 'Unity', 'Blender', 'OpenCV', 'FSM'],
    links: {
      github: 'https://github.com/ANonABento',
    },
    featured: false,
    dateCompleted: '2024-11',
  },
  {
    id: 'java-android-apps',
    name: 'Java & Android Applications',
    shortDescription: 'Android apps with CameraX object detection, AIML chatbot integration, and MBROLA text-to-speech synthesis.',
    category: 'Software',
    status: 'Completed',
    technologies: ['Java', 'Android Studio', 'OpenCV', 'AIML', 'TTS', 'CameraX'],
    links: {
      github: 'https://github.com/ANonABento',
    },
    featured: false,
    dateCompleted: '2024-06',
  },
];

// Helper functions
export function getProjectsByCategory(category: ProjectCategory | 'All'): Project[] {
  if (category === 'All') return PROJECTS;
  return PROJECTS.filter((p) => p.category === category);
}

export function getFeaturedProjects(): Project[] {
  return PROJECTS.filter((p) => p.featured);
}

export function getProjectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function getAllCategories(): (ProjectCategory | 'All')[] {
  const categories = new Set(PROJECTS.map((p) => p.category));
  return ['All', ...Array.from(categories)] as (ProjectCategory | 'All')[];
}

export function searchProjects(query: string, category: ProjectCategory | 'All'): Project[] {
  const lowerQuery = query.toLowerCase();
  return getProjectsByCategory(category).filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.shortDescription.toLowerCase().includes(lowerQuery) ||
      p.technologies.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}
