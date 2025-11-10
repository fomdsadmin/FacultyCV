// Singleton for managing user CV data state
class UserCvStore {
  constructor() {
    this.cv = null;
  }

  // Main getter
  getCv() {
    return this.cv;
  }

  // CV property getters
  getCurrentDate() {
    return this.cv?.current_date;
  }

  getJoinedDate() {
    return this.cv?.joined_date;
  }

  getStartYear() {
    return this.cv?.start_year;
  }

  getEndYear() {
    return this.cv?.end_year;
  }

  getSortOrder() {
    return this.cv?.sort_order;
  }

  getDateRangeText() {
    return this.cv?.date_range_text;
  }

  getTemplateTitle() {
    return this.cv?.template_title;
  }

  getUserId() {
    return this.cv?.user_id;
  }

  getFirstName() {
    return this.cv?.first_name;
  }

  getLastName() {
    return this.cv?.last_name;
  }

  getPreferredName() {
    return this.cv?.preferred_name;
  }

  getEmail() {
    return this.cv?.email;
  }

  getRole() {
    return this.cv?.role;
  }

  getBio() {
    return this.cv?.bio;
  }

  getRank() {
    return this.cv?.rank;
  }

  getInstitution() {
    return this.cv?.institution;
  }

  getPrimaryDepartment() {
    return this.cv?.primary_department;
  }

  getSecondaryDepartment() {
    return this.cv?.secondary_department;
  }

  getPrimaryFaculty() {
    return this.cv?.primary_faculty;
  }

  getSecondaryFaculty() {
    return this.cv?.secondary_faculty;
  }

  getPrimaryAffiliation() {
    return this.cv?.primary_affiliation;
  }

  getSecondaryAffiliation() {
    return this.cv?.secondary_affiliation;
  }

  getCampus() {
    return this.cv?.campus;
  }

  getKeywords() {
    return this.cv?.keywords;
  }

  getInstitutionUserId() {
    return this.cv?.institution_user_id;
  }

  getScopusId() {
    return this.cv?.scopus_id;
  }

  getOrcidId() {
    return this.cv?.orcid_id;
  }

  getJoinedTimestamp() {
    return this.cv?.joined_timestamp;
  }

  getPending() {
    return this.cv?.pending;
  }

  getApproved() {
    return this.cv?.approved;
  }

  getCwlUsername() {
    return this.cv?.cwl_username;
  }

  getVppUsername() {
    return this.cv?.vpp_username;
  }

  getActive() {
    return this.cv?.active;
  }

  getTerminated() {
    return this.cv?.terminated;
  }

  getPrimaryUnit() {
    return this.cv?.primary_unit;
  }

  getJointUnits() {
    return this.cv?.joint_units;
  }

  getResearchAffiliations() {
    return this.cv?.research_affiliations;
  }

  getHospitalAffiliations() {
    return this.cv?.hospital_affiliations;
  }

  // Setters
  setCv(cv) {
    this.cv = cv;
  }

  // Reset all data
  reset() {
    this.cv = null;
  }
}

// Export singleton instance
export const userCvStore = new UserCvStore();
