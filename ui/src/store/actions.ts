import { Profile } from '@/interfaces/Profile';
import apiService from '@/services/api.service';
import { Mutations, MutationType } from '@/store/mutations';
import { RootState, Section, TeamReportDataBundle } from '@/store/state';
import appConfig from '@/survey-results.json';
import { calcScore } from '@/utils/utils';
import { PageModel, SurveyModel } from 'survey-vue';
import { ActionContext, ActionTree } from 'vuex';

//TODO: use config file to trigger local vs remote data fetch
// at build time
const appConfigSettings = appConfig.settings;
const recommendations = appConfig;

export enum ActionTypes {
  /**
   * Fetches app data from local file and sets ```state.surveyModel``` with content.
   * If successfull, sets ```state.error``` to ```false```.
   * If not successfull, sets ```state.error``` to ```true```.
   * @param value ```undefined```
   */
  GetLocalAppData = 'GET_LOCAL_APP_DATA',
  /**
   * Sets sections with content of value.
   * @param value an ```SurveyModel``` object
   */
  SetSections = 'SET_SECTIONS',
  /**
   * Updates a matching section score in ```state.sections```with content of value.
   * @param value an ```PageModel``` object
   */
  UpdateSectionScore = 'UPDATE_SECTIONS_SCORES',
  // ---------------
  //Actions below are to help transition to new store structure
  // ---------------
  /**
   * Action to update the Survey Data
   * @param
   */
  UpdateSurveyData = 'UPDATE_SURVEY_DATA',
  UpdateCurrentPageName = 'UPDATE_CURRENT_PAGE_NAME',
  UseSurveyJSON = 'USE_SURVEY_JSON',

  // Actions for team survey
  AddTeamSurvey = 'ADD_TEAM_SURVEY',
  DeleteTeamSurvey = 'DELETE_TEAM_SURVEY',
  ShowIndividualBreakdown = 'SHOW_INDIVIDUAL_BREAKDOWN',
  HideIndividualBreakdown = 'HIDE_INDIVIDUAL_BREAKDOWN',
  SaveProfile = 'SAVE_PROFILE',
}

export type ActionAugments = Omit<ActionContext<RootState, RootState>, 'commit'> & {
  commit<K extends keyof Mutations>(key: K, payload?: Parameters<Mutations[K]>[1]): ReturnType<Mutations[K]>;
};

export type Actions = {
  [ActionTypes.GetLocalAppData](context: ActionAugments): void;
  [ActionTypes.SetSections](context: ActionAugments, value: SurveyModel): void;
  [ActionTypes.UpdateSectionScore](context: ActionAugments, value: PageModel): void;
  // ---------------
  //Actions below are to help transition to new store structure
  // ---------------
  [ActionTypes.UpdateSurveyData](context: ActionAugments, value: SurveyModel): void;
  [ActionTypes.UpdateCurrentPageName](context: ActionAugments, value: string): void;
  [ActionTypes.UseSurveyJSON](context: ActionAugments, value: { surveyJSON: any; surveyModel: SurveyModel }): void;
  // Team Survey actions
  [ActionTypes.AddTeamSurvey](context: ActionAugments, value: { teamReportDataBundle: TeamReportDataBundle }): void;
  [ActionTypes.DeleteTeamSurvey](context: ActionAugments, value: string): void;
  [ActionTypes.ShowIndividualBreakdown](context: ActionAugments, value: string): void;
  [ActionTypes.HideIndividualBreakdown](context: ActionAugments): void;
  [ActionTypes.SaveProfile](content: ActionAugments, profile: Profile): void;
};

export const actions: ActionTree<RootState, RootState> & Actions = {
  async [ActionTypes.GetLocalAppData]({ commit, getters }) {
    const surveyJson = await apiService.findLatestSurvey();
    const thisAppData: SurveyModel = new SurveyModel(surveyJson);
    commit(MutationType.SetSurveyModel, thisAppData);
    if (getters.returnSurveyModel !== undefined) {
      commit(MutationType.AppLoadingSuccess);
    } else {
      commit(MutationType.AppLoadingError);
    }
  },
  async [ActionTypes.SetSections]({ commit, getters }, value: SurveyModel) {
    let sections: Section[] = [];
    if (getters.returnSectionsNames.length > 0) {
      const sectionNames: string[] = getters.returnSectionsNames;
      sectionNames.forEach((sectionName) => {
        let newSection: Section = {
          sectionName: sectionName,
          enabled: false,
          completed: false,
          questionsNames: [],
          userScore: 0,
          maxScore: getters.returnSectionMaxScore(sectionName),
          questions: [],
        };
        value.getPageByName(sectionName).questions.forEach((question: any) => {
          newSection.questionsNames.push(question.name);
          newSection.questions.push(question);
        });
        sections.push(newSection);
      });
      commit(MutationType.SetSections, sections);
    }
  },
  async [ActionTypes.UpdateSectionScore]({ commit, getters }, value: PageModel) {
    let sectionScore: number = 0;
    let section: Section = getters.returnSectionByName(value.name);
    if (section !== undefined) {
      value.questions.forEach((question: any) => {
        if (question.value !== undefined) {
          const score = calcScore(question.getType(), question.value);
          sectionScore += score;
        }
      });
      section.userScore = sectionScore;
      commit(MutationType.UpdateSection, section);
    }
  },
  // ---------------
  //Actions below are to help transition to new store structure
  // ---------------
  async [ActionTypes.UpdateSurveyData]({ commit, dispatch, getters }, value: SurveyModel) {
    commit(MutationType.SetCurrentPageNo, value.currentPageNo);
    if (getters.returnRecommendations === undefined) {
      commit(MutationType.SetRecommendations, appConfig);
    }
    //Updating all sections instead as per current behavior
    let allPages: PageModel[] = value.pages;
    allPages.forEach((page) => {
      dispatch(ActionTypes.UpdateSectionScore, page);
    });
    commit(MutationType.SetToolData, value.data);
  },
  async [ActionTypes.UpdateCurrentPageName]({ commit }, value: string) {
    if (value.length > 0) {
      commit(MutationType.SetCurrentPageName, value);
    }
  },
  async [ActionTypes.UseSurveyJSON]({ commit, dispatch, getters }, { surveyJSON, surveyModel }) {
    commit(MutationType.SetSurveyJSON, surveyJSON);
    commit(MutationType.SetSurveyModel, surveyModel);
    const sectionsNames = getters.returnSectionsNamesGenerated;
    commit(MutationType.SetSectionsNames, sectionsNames);
    await dispatch(ActionTypes.SetSections, surveyModel);
    surveyModel.pages.forEach(async (page: any) => {
      await dispatch(ActionTypes.UpdateSectionScore, page);
    });
  },
  async [ActionTypes.AddTeamSurvey]({ commit }, { teamReportDataBundle }) {
    commit(MutationType.AddTeamSurvey, teamReportDataBundle);
  },
  async [ActionTypes.DeleteTeamSurvey]({ commit }, teamName) {
    commit(MutationType.DeleteTeamSurvey, teamName);
  },
  async [ActionTypes.ShowIndividualBreakdown]({ commit }, teamName) {
    commit(MutationType.ShowIndividualBreakdown, teamName);
  },
  async [ActionTypes.HideIndividualBreakdown]({ commit }) {
    commit(MutationType.HideIndividualBreakdown);
  },
  async [ActionTypes.SaveProfile]({ commit }, profile: Profile) {
    commit(MutationType.SaveProfile, profile);
  },
};
