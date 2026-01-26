// Projects Data - Type definitions and sample project data
// Used by ProjectsModal for the portfolio showcase

export type ProjectCategory = 'Hardware' | 'Software' | 'Full-Stack' | 'Robotics';
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
  };
  featured?: boolean;
  dateCompleted?: string;
}

// Sample projects - replace with real data
export const PROJECTS: Project[] = [
  {
    id: 'robot-arm',
    name: 'Robot Arm Controller',
    shortDescription: 'Automated picking system with Arduino and precision servo control for industrial automation.',
    category: 'Robotics',
    status: 'Completed',
    technologies: ['Arduino', 'C++', 'SolidWorks', 'Python'],
    links: {
      github: 'https://github.com/example/robot-arm',
      modelPath: '/models/placeholder.stl',
    },
    featured: true,
    dateCompleted: '2024-06-15',
  },
  {
    id: 'iot-dashboard',
    name: 'IoT Sensor Dashboard',
    shortDescription: 'Real-time monitoring dashboard for industrial sensors with data visualization and alerts.',
    category: 'Full-Stack',
    status: 'Completed',
    technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'MQTT'],
    links: {
      liveDemo: 'https://example.com/demo',
      github: 'https://github.com/example/iot-dashboard',
    },
    featured: true,
    dateCompleted: '2024-03-20',
  },
  {
    id: 'pcb-power-supply',
    name: 'Custom PCB Power Supply',
    shortDescription: 'High-efficiency switching power supply with custom PCB design for embedded systems.',
    category: 'Hardware',
    status: 'Completed',
    technologies: ['KiCad', 'LTSpice', 'Embedded C'],
    links: {
      github: 'https://github.com/example/power-supply',
    },
    featured: false,
    dateCompleted: '2024-01-10',
  },
  {
    id: 'ml-vision-system',
    name: 'ML Vision System',
    shortDescription: 'Computer vision system for quality control using machine learning and edge computing.',
    category: 'Software',
    status: 'Completed',
    technologies: ['Python', 'TensorFlow', 'OpenCV', 'Raspberry Pi'],
    links: {
      github: 'https://github.com/example/ml-vision',
    },
    featured: true,
    dateCompleted: '2024-04-05',
  },
  {
    id: 'drone-controller',
    name: 'Drone Flight Controller',
    shortDescription: 'Custom flight controller firmware with GPS waypoint navigation and telemetry.',
    category: 'Robotics',
    status: 'In Progress',
    technologies: ['STM32', 'C', 'FreeRTOS', 'Fusion 360'],
    links: {
      github: 'https://github.com/example/drone-fc',
      modelPath: '/models/placeholder.stl',
    },
    featured: false,
  },
  {
    id: 'smart-home-hub',
    name: 'Smart Home Hub',
    shortDescription: 'Centralized home automation controller with voice control and mobile app integration.',
    category: 'Full-Stack',
    status: 'Completed',
    technologies: ['React Native', 'Node.js', 'MQTT', 'ESP32'],
    links: {
      github: 'https://github.com/example/smart-home',
    },
    featured: false,
    dateCompleted: '2023-11-15',
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
