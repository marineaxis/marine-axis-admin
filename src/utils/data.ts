// Mock data for the Marine-Axis platform
// In production, this would come from APIs

export interface Provider {
  id: string;
  name: string;
  description: string;
  services: string[];
  location: string;
  rating: number;
  reviewCount: number;
  image: string;
  phone: string;
  email: string;
  website?: string;
  certifications: string[];
  yearsInBusiness: number;
  specialties: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary';
  salary?: string;
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  applicationDeadline?: string;
  contactEmail: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedDate: string;
  tags: string[];
  image: string;
  slug: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
}

// Mock Providers Data
export const providers: Provider[] = [
  {
    id: '1',
    name: 'Global Marine Solutions',
    description: 'Leading provider of comprehensive marine maintenance and repair services worldwide.',
    services: ['Ship Maintenance', 'Engine Repair', 'Hull Cleaning', 'Electrical Systems'],
    location: 'Hamburg, Germany',
    rating: 4.8,
    reviewCount: 156,
    image: '/api/placeholder/400/300',
    phone: '+49 40 123 4567',
    email: 'contact@globalmarine.de',
    website: 'https://globalmarine.de',
    certifications: ['ISO 9001', 'MLC 2006', 'ISPS'],
    yearsInBusiness: 25,
    specialties: ['Container Ships', 'Tankers', 'Bulk Carriers']
  },
  {
    id: '2',
    name: 'Pacific Port Services',
    description: 'Specialized port operations and logistics solutions across the Pacific region.',
    services: ['Port Operations', 'Cargo Handling', 'Logistics', 'Warehousing'],
    location: 'Singapore',
    rating: 4.6,
    reviewCount: 89,
    image: '/api/placeholder/400/300',
    phone: '+65 6123 4567',
    email: 'info@pacificport.sg',
    certifications: ['ISO 28000', 'OHSAS 18001'],
    yearsInBusiness: 15,
    specialties: ['Container Terminals', 'Bulk Cargo', 'Project Cargo']
  },
  {
    id: '3',
    name: 'Atlantic Marine Consulting',
    description: 'Expert maritime consulting services for vessel operations and regulatory compliance.',
    services: ['Marine Consulting', 'Vessel Inspections', 'Compliance', 'Training'],
    location: 'Rotterdam, Netherlands',
    rating: 4.9,
    reviewCount: 234,
    image: '/api/placeholder/400/300',
    phone: '+31 10 123 4567',
    email: 'experts@atlanticmarine.nl',
    website: 'https://atlanticmarine.nl',
    certifications: ['IMO Certified', 'Class NK', 'Lloyd\'s Register'],
    yearsInBusiness: 30,
    specialties: ['Regulatory Compliance', 'Safety Audits', 'Environmental Standards']
  }
];

// Mock Jobs Data
export const jobs: Job[] = [
  {
    id: '1',
    title: 'Marine Engineer',
    company: 'Global Shipping Co.',
    location: 'Hamburg, Germany',
    type: 'Full-time',
    salary: '€65,000 - €85,000',
    description: 'We are seeking an experienced Marine Engineer to join our technical team. The role involves maintaining and repairing marine engines, overseeing mechanical systems, and ensuring compliance with maritime regulations.',
    requirements: [
      'Bachelor\'s degree in Marine Engineering',
      '5+ years experience in marine engine maintenance',
      'Valid STCW certificates',
      'Knowledge of diesel and gas turbine engines'
    ],
    benefits: [
      'Competitive salary',
      'Health insurance',
      'Rotation schedule (4 months on/2 months off)',
      'Professional development opportunities'
    ],
    postedDate: '2024-01-15',
    applicationDeadline: '2024-02-15',
    contactEmail: 'careers@globalshipping.com'
  },
  {
    id: '2',
    title: 'Port Operations Manager',
    company: 'Pacific Port Services',
    location: 'Singapore',
    type: 'Full-time',
    salary: 'S$120,000 - S$150,000',
    description: 'Lead our port operations team in Singapore. Oversee daily operations, coordinate with shipping lines, and optimize terminal efficiency.',
    requirements: [
      'Degree in Maritime Studies or related field',
      '8+ years port operations experience',
      'Strong leadership skills',
      'Knowledge of port management systems'
    ],
    benefits: [
      'Excellent compensation package',
      'Annual bonus',
      'Medical benefits',
      'Career advancement opportunities'
    ],
    postedDate: '2024-01-10',
    contactEmail: 'hr@pacificport.sg'
  },
  {
    id: '3',
    title: 'Maritime Safety Inspector',
    company: 'Atlantic Marine Consulting',
    location: 'Rotterdam, Netherlands',
    type: 'Contract',
    salary: '€450 per day',
    description: 'Conduct vessel safety inspections and compliance audits. Travel required to various ports across Europe.',
    requirements: [
      'Marine surveyor qualification',
      '10+ years inspection experience',
      'IMO certified inspector',
      'Fluent in English and Dutch'
    ],
    benefits: [
      'Flexible schedule',
      'Travel allowances',
      'Training opportunities',
      'Network building'
    ],
    postedDate: '2024-01-12',
    applicationDeadline: '2024-01-30',
    contactEmail: 'inspectors@atlanticmarine.nl'
  }
];

// Mock Blog Posts Data
export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Future of Maritime Digitalization',
    excerpt: 'Exploring how digital technologies are transforming the maritime industry and what it means for service providers.',
    content: `
# The Future of Maritime Digitalization

The maritime industry is undergoing a significant digital transformation. From autonomous vessels to IoT-enabled port operations, technology is reshaping how we think about marine services.

## Key Trends

1. **Autonomous Navigation Systems**: Advanced AI and sensor technology are enabling safer, more efficient vessel operations.

2. **Predictive Maintenance**: IoT sensors and data analytics help predict equipment failures before they occur.

3. **Digital Port Operations**: Smart ports are using automation and data analytics to optimize cargo handling and reduce wait times.

## Impact on Service Providers

Maritime service providers must adapt to these changes by:
- Investing in digital skills training
- Upgrading equipment and systems
- Partnering with technology companies
- Focusing on data-driven decision making

The companies that embrace digitalization will be best positioned for future success in the maritime industry.
    `,
    author: 'Dr. Sarah Mitchell',
    publishedDate: '2024-01-20',
    tags: ['Technology', 'Digital Transformation', 'Maritime Industry'],
    image: '/api/placeholder/600/400',
    slug: 'future-maritime-digitalization'
  },
  {
    id: '2',
    title: 'Sustainable Shipping: Environmental Regulations and Compliance',
    excerpt: 'Understanding the latest environmental regulations affecting the shipping industry and how to ensure compliance.',
    content: `
# Sustainable Shipping: Environmental Regulations and Compliance

Environmental sustainability has become a critical concern in the maritime industry. New regulations are driving significant changes in how ships operate and how services are delivered.

## Recent Regulatory Changes

- **IMO 2020 Sulfur Regulations**: Limiting sulfur content in marine fuels
- **Ballast Water Management**: New requirements for ballast water treatment
- **Carbon Intensity Indicators**: Measuring and reducing CO2 emissions

## Compliance Strategies

Service providers can help ship owners comply by offering:
1. Environmental auditing services
2. Scrubber installation and maintenance
3. Alternative fuel solutions
4. Emission monitoring systems

The shift toward sustainability represents both challenges and opportunities for the maritime industry.
    `,
    author: 'Captain James Rodriguez',
    publishedDate: '2024-01-18',
    tags: ['Environment', 'Regulations', 'Sustainability'],
    image: '/api/placeholder/600/400',
    slug: 'sustainable-shipping-regulations'
  },
  {
    id: '3',
    title: 'Career Opportunities in Modern Maritime Industry',
    excerpt: 'Discover the diverse career paths available in today\'s evolving maritime sector.',
    content: `
# Career Opportunities in Modern Maritime Industry

The maritime industry offers diverse career opportunities for professionals at all levels. From traditional seafaring roles to cutting-edge technology positions, the sector continues to evolve.

## Traditional Maritime Careers

- **Deck Officers**: Navigation and ship operations
- **Marine Engineers**: Engine room operations and maintenance
- **Port Workers**: Cargo handling and terminal operations

## Emerging Career Paths

- **Maritime Technology Specialists**: Implementing digital solutions
- **Environmental Compliance Officers**: Ensuring regulatory adherence
- **Maritime Cybersecurity Experts**: Protecting digital systems

## Skills in Demand

The modern maritime professional should develop:
1. Digital literacy
2. Environmental awareness
3. Safety management
4. Cross-cultural communication
5. Problem-solving abilities

The industry offers excellent career progression and competitive compensation for skilled professionals.
    `,
    author: 'Maria Santos',
    publishedDate: '2024-01-15',
    tags: ['Careers', 'Maritime Jobs', 'Professional Development'],
    image: '/api/placeholder/600/400',
    slug: 'maritime-career-opportunities'
  }
];

// Mock Services Data
export const services: Service[] = [
  {
    id: '1',
    name: 'Ship Maintenance & Repair',
    description: 'Comprehensive maintenance and repair services for all vessel types.',
    icon: 'Wrench',
    features: [
      'Engine maintenance and overhaul',
      'Hull cleaning and painting',
      'Electrical system repairs',
      'Safety equipment servicing',
      '24/7 emergency repairs'
    ]
  },
  {
    id: '2',
    name: 'Port Services',
    description: 'Complete port and terminal operations support.',
    icon: 'Anchor',
    features: [
      'Cargo handling operations',
      'Vessel berthing services',
      'Terminal logistics',
      'Customs clearance support',
      'Storage and warehousing'
    ]
  },
  {
    id: '3',
    name: 'Marine Consulting',
    description: 'Expert advice on maritime operations and compliance.',
    icon: 'Users',
    features: [
      'Regulatory compliance audits',
      'Safety management systems',
      'Vessel inspections',
      'Environmental assessments',
      'Training and certification'
    ]
  },
  {
    id: '4',
    name: 'Equipment Supply',
    description: 'Quality marine equipment and spare parts supply.',
    icon: 'Package',
    features: [
      'Engine parts and components',
      'Safety and navigation equipment',
      'Deck machinery supplies',
      'Electrical components',
      'Emergency parts delivery'
    ]
  },
  {
    id: '5',
    name: 'Logistics & Transport',
    description: 'Efficient maritime logistics and transportation solutions.',
    icon: 'Truck',
    features: [
      'Cargo transportation',
      'Supply chain management',
      'Route optimization',
      'Intermodal connections',
      'Tracking and monitoring'
    ]
  },
  {
    id: '6',
    name: 'Training & Certification',
    description: 'Professional maritime training and certification programs.',
    icon: 'GraduationCap',
    features: [
      'STCW certification courses',
      'Safety training programs',
      'Equipment operation training',
      'Compliance workshops',
      'Online learning platforms'
    ]
  }
];

// Helper functions
export const getProviderById = (id: string): Provider | undefined => {
  return providers.find(provider => provider.id === id);
};

export const getJobById = (id: string): Job | undefined => {
  return jobs.find(job => job.id === id);
};

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => {
  return blogPosts.find(post => post.slug === slug);
};

export const searchProviders = (query: string, category?: string): Provider[] => {
  return providers.filter(provider => {
    const matchesQuery = query === '' || 
      provider.name.toLowerCase().includes(query.toLowerCase()) ||
      provider.description.toLowerCase().includes(query.toLowerCase()) ||
      provider.services.some(service => service.toLowerCase().includes(query.toLowerCase()));
    
    const matchesCategory = !category || 
      provider.services.some(service => service.toLowerCase().includes(category.toLowerCase()));
    
    return matchesQuery && matchesCategory;
  });
};

export const searchJobs = (query: string, type?: string, location?: string): Job[] => {
  return jobs.filter(job => {
    const matchesQuery = query === '' || 
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase()) ||
      job.description.toLowerCase().includes(query.toLowerCase());
    
    const matchesType = !type || job.type === type;
    const matchesLocation = !location || job.location.toLowerCase().includes(location.toLowerCase());
    
    return matchesQuery && matchesType && matchesLocation;
  });
};