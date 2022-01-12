import { Question, SurveyModel } from "survey-vue";

export interface RootState {
  surveyModel?: SurveyModel;
  answerData: any[];
  toolData: any;
  sections: Section[];
  sectionsNames: string[];
  currentPageNo: number;
  currentPageName?: string;
  recommendations?: Recommendations;
  toolVersion: string;
  sectionsPrefix: string;
  error: boolean;
  loading: boolean;
  initialized: boolean;
  surveyJSON: any;
  teamReportDataArray: TeamReportData[];
}

export interface Section {
  sectionName: string;
  enabled: boolean;
  completed: boolean;
  questionsNames: string[];
  userScore: number;
  maxScore: number;
  questions: Question[];
}

export interface TeamReportData {
  name: string;
  sections: Array<SectionReportData>;
}

export interface SectionReportData {
  name: string;
  score: number;
  maxScore: number;
  questions: Array<QuestionReportData>;
  title: string;
}

export interface QuestionReportData {
  name: string;
  type: string;
  answer: boolean | number | string;
  title: string;
}

export type LanguageString = {
  en: string;
  fr: string;
};

// Generated by https://quicktype.io

export interface Recommendations {
  settings: Settings;
  sectionRecommendations: SectionRecommendation[];
  performance: Performance[];
}

export interface Settings {
  version: string;
  scoreType: string;
  scoreTags: string;
}

export interface Performance {
  level: string;
  title: Message;
  message: Message;
}

export interface Message {
  en: string;
  fr: string;
}

export interface SectionRecommendation {
  name: string;
  icon: string;
  recommendations: Recommendation[];
}

export interface Recommendation {
  level: string;
  type: string;
  title: Title;
}

export interface Title {
  en: string[];
  fr: string[];
}

export const state: RootState = {
  surveyModel: undefined,
  answerData: [],
  toolData: undefined,
  sections: [],
  sectionsNames: [],
  currentPageNo: 0,
  currentPageName: undefined,
  recommendations: undefined,
  toolVersion: "",
  sectionsPrefix: "",
  error: false,
  loading: false,
  initialized: false,
  surveyJSON: undefined,
  teamReportDataArray: []
};
