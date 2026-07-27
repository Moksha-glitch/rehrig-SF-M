import { onboardingService } from '../../services/onboardingService.js';

/**
 * API assistant / contract extract — talks to vision-api only.
 * Chat field parsing remains local in UI components.
 */

export async function extractContractFile(file) {
  const data = await onboardingService.extractContract(file);
  return {
    companyName: data.companyName,
    registrationNumber: data.registrationNumber || '',
    contractValue: data.contractValue || '',
    startDate: data.startDate || '2026-08-01',
    endDate: data.endDate || '2029-07-31',
    signatoryName: data.signatoryName || '',
    signatoryEmail: data.signatoryEmail || 'contracts@example.com',
    serviceTypes: data.serviceTypes || 'Residential, Commercial',
    fileName: file?.name || data.fileName,
  };
}

export async function extractWizardAccountFromContract(file) {
  const data = await extractContractFile(file);
  const denver = /denver/i.test(file?.name || data.fileName || '');
  return {
    accountName: data.companyName || (denver ? 'Denver Metro Recycling' : 'Edmonton AB Sanitation Co.'),
    uid: '',
    phone: '',
    website: denver ? 'denvermetro.example' : 'edmonton.example',
    supportEmail: '',
    industry: 'Municipal',
    type: 'Customer',
    description: `Extracted from contract “${file?.name || data.fileName}”.`,
    employees: 120,
    serviceTypes: String(data.serviceTypes || 'Residential, Commercial')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
    modules: 'WO, Dispatch, Tips, Notifications',
    billing: {
      country: 'Canada',
      street: denver ? '1600 Broadway' : '9803 102A Ave NW',
      city: denver ? 'Denver' : 'Edmonton',
      state: denver ? 'Colorado' : 'Alberta',
      zip: denver ? '80202' : 'T5J 3A3',
    },
  };
}
