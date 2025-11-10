import { initializeAlaSQL } from "Pages/TemplatePages/TemplateBuilder/Table/sqlquerycomponent/alasqlUtils";

// Singleton for managing template and user data state
class TemplateDataStore {
  constructor() {
    this.userCvDataMap = {};
    this.sectionsMap = {};
    this.template = {};
    this.sortAscending = null;
    this.userInfo = null;
    this.alaSqlInitialized = false;
    this.initializeAlaSQL();
  }

  // Initialize AlaSQL only once
  initializeAlaSQL() {
    if (!this.alaSqlInitialized) {
      initializeAlaSQL();
      this.alaSqlInitialized = true;
    }
  }

  // Getters (read-only access)
  getUserCvDataMap() {
    return this.userCvDataMap;
  }

  getSectionsMap() {
    return this.sectionsMap;
  }

  getTemplate() {
    return this.template;
  }

  getSortAscending() {
    return this.sortAscending;
  }

  getUserInfo() {
    return this.userInfo;
  }

  // Setters (only for mutable data)
  setUserCvDataMap(data) {
    this.userCvDataMap = data;
  }

  setUserInfo(info) {
    this.userInfo = info;
  }

  // Initializers (for immutable/const data)
  initializeSectionsMap(map) {
    this.sectionsMap = map;
  }

  initializeTemplate(template) {
    this.template = template;
  }

  initializeSortAscending(value) {
    this.sortAscending = value;
  }

  // Reset all data
  reset() {
    this.userCvDataMap = {};
    this.sectionsMap = {};
    this.template = {};
    this.sortAscending = null;
    this.userInfo = null;
  }
}

// Export singleton instance
export const templateDataStore = new TemplateDataStore();
