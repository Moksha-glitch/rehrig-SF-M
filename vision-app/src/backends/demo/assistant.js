/**
 * Demo assistant / contract extract — fully local, no network.
 * Chat parsing stays in UI helpers; only extraction is backend-shaped here.
 */

export async function extractContractFile(file) {
  const denver = /denver/i.test(file?.name || '');
  return {
    companyName: denver ? 'Denver Metro Recycling' : 'Edmonton AB Sanitation Co.',
    registrationNumber: '',
    contractValue: '',
    startDate: '2026-08-01',
    endDate: '2029-07-31',
    signatoryName: '',
    signatoryEmail: 'contracts@example.com',
    serviceTypes: 'Residential, Commercial',
    fileName: file?.name,
  };
}

/** Map contract extract → wizard Step 1 account fields (demo). */
export async function extractWizardAccountFromContract(file) {
  const data = await extractContractFile(file);
  const denver = /denver/i.test(file?.name || '');
  return {
    accountName: data.companyName,
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
