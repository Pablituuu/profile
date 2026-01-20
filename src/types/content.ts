export interface Project {
  title: string;
  url: string;
  github: string;
  image: string;
  desc: string;
  techs: string[];
}

export interface Experience {
  company: string;
  url?: string;
  image?: string;
  role: string;
  period: string;
  desc: string;
  techs: string[];
}

export interface Reference {
  name: string;
  role: string;
  company: string;
  tel: string;
}
