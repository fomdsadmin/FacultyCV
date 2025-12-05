import { initializeAlaSQL } from "Pages/TemplatePages/TemplateBuilder/Table/sqlquerycomponent/alasqlUtils";

// Singleton for managing template and user data state
class TemplateDataStore {
  // Static property to track AlaSQL initialization across all instances
  static alaSqlInitialized = false;

  constructor(sectionsMap, template, sortAscending) {
    this.userCvDataMap = {};
    this.sectionsMap = sectionsMap;
    this.template = template;
    this.sortAscending = sortAscending;
    this.userInfo = null;
    this.initializeAlaSQL();
  }

  // Initialize AlaSQL only once for all instances
  initializeAlaSQL() {
    if (!TemplateDataStore.alaSqlInitialized) {
      initializeAlaSQL();
      TemplateDataStore.alaSqlInitialized = true;
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
export { TemplateDataStore };
