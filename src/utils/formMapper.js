/**
 * Maps Claude's insurance_data to form fields
 */
export function mapClaudeToForm(insuranceData) {
  if (!insuranceData) return getEmptyForm();

  return {
    chiefComplaint: insuranceData.chief_complaint || '',
    symptomDuration: insuranceData.symptom_duration || '',
    functionalImpairment: insuranceData.functional_impairment || '',
    diagnosisCategory: insuranceData.diagnosis_category || '',
    requestedService: insuranceData.requested_service || 'therapy',
    patientName: '',
    dob: '',
    insuranceId: '',
    groupNumber: '',
    providerName: '',
    providerNPI: '',
  };
}

export function getEmptyForm() {
  return {
    chiefComplaint: '',
    symptomDuration: '',
    functionalImpairment: '',
    diagnosisCategory: '',
    requestedService: 'therapy',
    patientName: '',
    dob: '',
    insuranceId: '',
    groupNumber: '',
    providerName: '',
    providerNPI: '',
  };
}
