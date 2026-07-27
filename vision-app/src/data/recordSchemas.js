// Sectioned schemas for operational records (Spec Ch.18-20, Ch.25) and their sample rows.
import { PICKLISTS } from './picklists.js';

const P = PICKLISTS;

export const RECORD_SCHEMAS = {
  workOrders: {
    title: 'Work Orders',
    newLabel: 'New Work Order',
    singular: 'Work Order',
    listColumns: [
      { key: 'number', label: 'Work Order #' },
      { key: 'requestType', label: 'Request Type' },
      { key: 'status', label: 'Status' },
      { key: 'account', label: 'Account' },
      { key: 'dueDate', label: 'Due Date' },
    ],
    sections: [
      {
        title: 'Detail',
        fields: [
          { key: 'number', label: 'Work Order Number', type: 'readonly' },
          { key: 'owner', label: 'Work Order Owner', type: 'text' },
          { key: 'requestTypeName', label: 'Request Type Name', type: 'readonly' },
          { key: 'status', label: 'Case Status', type: 'select', options: P.workOrderStatus },
          { key: 'contactName', label: 'Contact Name', type: 'lookup' },
          { key: 'closedDesired', label: 'Closed with Desired Resolution', type: 'checkbox' },
          { key: 'account', label: 'Account Name', type: 'lookup', required: true },
          { key: 'contactPhone', label: 'Contact Phone', type: 'text' },
          { key: 'contactEmail', label: 'Contact Email', type: 'text' },
          { key: 'attachments', label: 'Number of Attachments', type: 'number' },
          { key: 'subject', label: 'Subject', type: 'text' },
          { key: 'serviceType', label: 'Service Type', type: 'select', options: P.serviceType },
          { key: 'quantitySize', label: 'Quantity / Size', type: 'text' },
        ],
      },
      {
        title: 'Work Order Information',
        fields: [
          { key: 'dueDate', label: 'Due Date', type: 'date' },
          { key: 'hotTicket', label: 'Hot Ticket', type: 'checkbox' },
          { key: 'dueDateType', label: 'Due Date Type', type: 'select', options: P.dueDateType },
          { key: 'requestDate', label: 'Request Date', type: 'date' },
          { key: 'requestType', label: 'Request Type', type: 'select', options: P.requestType, required: true },
          { key: 'completionDate', label: 'Completion Date', type: 'datetime' },
          { key: 'resolutionCode', label: 'Request Type Resolution Code', type: 'select', options: P.resolutionCode },
          { key: 'location', label: 'Customer Account (Location)', type: 'lookup' },
          { key: 'dispatch', label: 'Dispatch', type: 'lookup' },
          { key: 'resolutionComments', label: 'Resolution Comments', type: 'textarea' },
          { key: 'woNotes', label: 'WO Notes', type: 'textarea' },
          { key: 'attempts', label: 'Number of Attempts', type: 'number' },
        ],
      },
      {
        title: 'Asset Information',
        fields: [
          { key: 'asset', label: 'Asset', type: 'lookup' },
          { key: 'assetToRemove', label: 'Asset To Remove / Repair', type: 'lookup' },
          { key: 'assetType', label: 'Asset Type', type: 'lookup' },
          { key: 'deliveredAsset', label: 'Delivered Asset Serial #', type: 'lookup' },
          { key: 'relocatedAsset', label: 'Relocated Asset', type: 'lookup' },
        ],
      },
    ],
    sample: [
      { number: '03933942', customerId: 'cust-1001', requestType: 'Deliver', status: 'Open', account: 'Edmonton AB', location: '9803 102A Ave NW', dueDate: '2026-07-03' },
      { number: '03931120', customerId: 'cust-1001', requestType: 'Missed Pickup', status: 'Closed', account: 'Edmonton AB', location: '9803 102A Ave NW', dueDate: '2026-06-20' },
      { number: '03933920', requestType: 'Inactive Account Removal', status: 'In Progress', account: 'Edmonton AB', dueDate: '2026-07-02' },
      { number: '03933901', requestType: 'Missed Pickup', status: 'On Hold', account: 'Toronto Waste Services', dueDate: '2026-07-05' },
      { number: '03933888', requestType: 'Repair', status: 'Closed', account: 'Calgary Metro Waste', dueDate: '2026-06-28' },
    ],
  },

  dispatches: {
    title: 'Dispatches',
    newLabel: 'New Dispatch',
    singular: 'Dispatch',
    listColumns: [
      { key: 'number', label: 'Dispatch #' },
      { key: 'status', label: 'Status' },
      { key: 'routeDate', label: 'Route Date' },
      { key: 'truck', label: 'Truck' },
      { key: 'driver', label: 'Driver' },
    ],
    sections: [
      {
        title: 'Dispatch',
        fields: [
          { key: 'number', label: 'Dispatch Number', type: 'text' },
          { key: 'mrp', label: 'Maintenance Route Profile', type: 'lookup' },
          { key: 'account', label: 'Service Provider', type: 'lookup', required: true },
          { key: 'status', label: 'Status', type: 'select', options: P.dispatchStatus },
          { key: 'routeDate', label: 'Route Date', type: 'date', required: true },
          { key: 'segment', label: 'Service Provider Segment', type: 'lookup' },
          { key: 'serviceType', label: 'Service Type', type: 'select', options: P.serviceType },
          { key: 'truck', label: 'Truck', type: 'lookup' },
          { key: 'driver', label: 'Driver', type: 'lookup' },
          { key: 'startTime', label: 'Start Time', type: 'time' },
        ],
      },
    ],
    sample: [
      { number: 'D-72110', status: 'In Route', routeDate: '2026-07-01', truck: 'TRK-201', driver: 'David Thornton' },
      { number: 'D-72114', status: 'Scheduled', routeDate: '2026-07-01', truck: 'TRK-102', driver: 'Ravi Nair' },
      { number: 'D-72098', status: 'Complete', routeDate: '2026-06-30', truck: 'TRK-115', driver: 'Marcus Chen' },
    ],
  },

  assets: {
    title: 'Assets',
    newLabel: 'New Asset',
    singular: 'Asset',
    listColumns: [
      { key: 'name', label: 'Asset Name' },
      { key: 'status', label: 'Status' },
      { key: 'product', label: 'Product' },
      { key: 'serial', label: 'Serial #' },
    ],
    sections: [
      {
        title: 'Asset Information',
        fields: [
          { key: 'name', label: 'Asset Name', type: 'text', required: true },
          { key: 'status', label: 'Asset Status', type: 'select', options: P.assetStatus },
          { key: 'product', label: 'Product', type: 'lookup', required: true },
          { key: 'subStatus', label: 'Asset Sub-Status', type: 'select', options: P.assetSubStatus },
          { key: 'account', label: 'Account', type: 'lookup', required: true },
          { key: 'serial', label: 'Serial Number', type: 'text' },
          { key: 'competitor', label: 'Competitor Asset', type: 'checkbox' },
          { key: 'conditions', label: 'Industrial Container Conditions', type: 'select', options: P.industrialContainerConditions },
          { key: 'recordType', label: 'Asset Record Type', type: 'readonly' },
        ],
      },
      {
        title: 'Asset Details',
        fields: [
          { key: 'unvalidated', label: 'Un-Validated Serial Number', type: 'checkbox' },
          { key: 'externalId', label: 'External Id', type: 'text' },
          { key: 'poolId', label: 'Pool Id', type: 'text' },
          { key: 'rfid', label: 'RFID Number', type: 'text' },
          { key: 'container', label: 'Container Number', type: 'text' },
          { key: 'homeLatLong', label: 'Home Latitude / Longitude', type: 'text' },
          { key: 'price', label: 'Price', type: 'number' },
          { key: 'location', label: 'Customer Location', type: 'lookup' },
          { key: 'warehouse', label: 'Warehouse', type: 'lookup' },
          { key: 'purchaseDate', label: 'Purchase Date', type: 'date' },
          { key: 'installDate', label: 'Install Date', type: 'date' },
        ],
      },
      {
        title: 'Insync Integration',
        fields: [
          { key: 'insyncId', label: 'InsyncId', type: 'text' },
          { key: 'syncStatus', label: 'SyncStatus', type: 'select', options: P.syncStatus },
          { key: 'syncIteration', label: 'SyncIteration', type: 'number' },
        ],
      },
    ],
    sample: [
      { name: 'CART-000123', status: 'In Service', product: '96 Gallon Trash', serial: 'SN-90012' },
      { name: 'CART-000124', status: 'Awaiting Repair', product: '120 Liter Trash', serial: 'SN-90013' },
      { name: 'BIN-002210', status: 'Available', product: '3 YD Recycle Bin Recycling', serial: 'SN-71120' },
    ],
  },

  trucks: {
    title: 'Trucks',
    newLabel: 'New Truck',
    singular: 'Truck',
    listColumns: [
      { key: 'name', label: 'Truck Name' },
      { key: 'number', label: 'Truck #' },
      { key: 'status', label: 'Status' },
      { key: 'type', label: 'Type' },
    ],
    sections: [
      {
        title: 'Information',
        fields: [
          { key: 'name', label: 'Truck Name', type: 'text', required: true },
          { key: 'number', label: 'Truck #', type: 'text' },
          { key: 'account', label: 'Service Provider', type: 'lookup', required: true },
          { key: 'warehouse', label: 'Warehouse Location', type: 'lookup' },
          { key: 'status', label: 'Status', type: 'select', options: P.truckStatus },
          { key: 'segment', label: 'Segment', type: 'lookup' },
          { key: 'timezone', label: 'Timezone', type: 'select', options: P.timeZone, required: true },
        ],
      },
      {
        title: 'Truck Details',
        fields: [
          { key: 'bodyMake', label: 'Body Make', type: 'text' },
          { key: 'serviceType', label: 'Service Type', type: 'select', options: P.truckServiceType },
          { key: 'chassisMake', label: 'Chassis Make', type: 'text' },
          { key: 'type', label: 'Type', type: 'select', options: P.truckType },
          { key: 'fuelType', label: 'Fuel Type', type: 'select', options: P.fuelType },
          { key: 'plate', label: 'Plate #', type: 'text' },
          { key: 'size', label: 'Size', type: 'text' },
        ],
      },
    ],
    sample: [
      { name: 'Side-Loader 201', number: 'TRK-201', status: 'Active', type: 'Side-Loader' },
      { name: 'Rear-Loader 102', number: 'TRK-102', status: 'Active', type: 'Rear-Loader' },
      { name: 'Roll-Off 115', number: 'TRK-115', status: 'Being Repaired', type: 'Roll-Off' },
    ],
  },

  locations: {
    title: 'Locations',
    newLabel: 'New Location',
    singular: 'Location',
    listColumns: [
      { key: 'number', label: 'Location #' },
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Location Type' },
      { key: 'city', label: 'City' },
    ],
    sections: [
      {
        title: 'Location',
        fields: [
          { key: 'number', label: 'Location Number', type: 'text' },
          { key: 'name', label: 'Location Name', type: 'text' },
          { key: 'account', label: 'Service Provider', type: 'lookup', required: true },
          { key: 'type', label: 'Location Type', type: 'select', options: P.locationType },
          { key: 'houseNumber', label: 'House Number', type: 'text' },
          { key: 'street', label: 'Street', type: 'textarea' },
          { key: 'unit', label: 'Unit #', type: 'text' },
          { key: 'city', label: 'City', type: 'text' },
          { key: 'state', label: 'State', type: 'select', options: P.provinceState },
          { key: 'zip', label: 'Zip Code', type: 'text' },
          { key: 'country', label: 'Country', type: 'select', options: P.mailingCountry },
        ],
      },
      {
        title: 'Routing',
        fields: [
          { key: 'trashRoute', label: 'Trash Collection Route', type: 'lookup' },
          { key: 'recycleRoute', label: 'Recycle Collection Route', type: 'lookup' },
          { key: 'organicRoute', label: 'Organic Collection Route', type: 'lookup' },
          { key: 'yardRoute', label: 'Yard Waste Route', type: 'lookup' },
          { key: 'segment', label: 'Segment', type: 'lookup' },
          { key: 'isValidated', label: 'Is Validated', type: 'checkbox' },
        ],
      },
    ],
    sample: [
      { number: 'LOC-00001', name: '9803 102A Ave', type: 'Single-Family Home', city: 'Edmonton' },
      { number: 'LOC-00002', name: '100 Queen St W', type: 'Commercial Business', city: 'Toronto' },
    ],
  },

  maintenanceRouteProfiles: {
    title: 'Maintenance Route Profiles',
    newLabel: 'New Maintenance Route Profile',
    singular: 'Maintenance Route Profile',
    listColumns: [
      { key: 'name', label: 'Name' },
      { key: 'segment', label: 'Segment' },
      { key: 'serviceType', label: 'Service Type' },
      { key: 'status', label: 'Status' },
    ],
    sections: [
      {
        title: 'Profile',
        fields: [
          { key: 'name', label: 'Profile Name', type: 'text', required: true },
          { key: 'account', label: 'Service Provider', type: 'lookup', required: true },
          { key: 'segment', label: 'Segment', type: 'lookup' },
          { key: 'serviceType', label: 'Service Type', type: 'select', options: P.serviceType },
          { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
        ],
      },
    ],
    sample: [
      { name: 'MRP-Downtown', segment: 'Downtown District', serviceType: 'Residential', status: 'Active' },
      { name: 'MRP-Hauler1', segment: 'Hauler 1', serviceType: 'Commercial', status: 'Active' },
      { name: 'MRP-DivisionA', segment: 'Division A', serviceType: 'Residential', status: 'Active' },
      { name: 'MRP-Weekend', segment: 'Edmonton AB Top', serviceType: 'Residential', status: 'Inactive' },
      { name: 'MRP-Industrial', segment: 'Hauler 1', serviceType: 'Industrial', status: 'Active' },
    ],
  },

  notesAttachments: {
    title: 'Notes & Attachments',
    newLabel: 'New Note',
    singular: 'Note',
    listColumns: [
      { key: 'title', label: 'Title' },
      { key: 'relatedTo', label: 'Related To' },
      { key: 'type', label: 'Type' },
      { key: 'createdBy', label: 'Created By' },
    ],
    sections: [
      {
        title: 'Note',
        fields: [
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'relatedTo', label: 'Related To', type: 'lookup' },
          { key: 'type', label: 'Type', type: 'select', options: ['Note', 'Attachment'] },
          { key: 'body', label: 'Body', type: 'textarea' },
        ],
      },
    ],
    sample: [
      { title: 'Site access note', relatedTo: 'LOC-00001', type: 'Note', createdBy: 'Yolanda Wagner' },
      { title: 'Cart photo.jpg', relatedTo: 'CART-000123', type: 'Attachment', createdBy: 'David Thornton' },
    ],
  },

  requestTypeResolutions: {
    title: 'Request Type / Resolutions',
    newLabel: 'New Request Type',
    singular: 'Request Type',
    listColumns: [
      { key: 'name', label: 'Request Type' },
      { key: 'resolution', label: 'Default Resolution' },
      { key: 'serviceType', label: 'Service Type' },
      { key: 'active', label: 'Active' },
    ],
    sections: [
      {
        title: 'Request Type',
        fields: [
          { key: 'name', label: 'Request Type', type: 'select', options: P.requestType, required: true },
          { key: 'resolution', label: 'Default Resolution Code', type: 'select', options: P.resolutionCode },
          { key: 'serviceType', label: 'Service Type', type: 'select', options: P.serviceType },
          { key: 'active', label: 'Active', type: 'checkbox' },
        ],
      },
    ],
    sample: [
      { name: 'Deliver', resolution: 'Schedule delivery', serviceType: 'Residential', active: 'Yes' },
      { name: 'Replace', resolution: 'Replace within 3 days', serviceType: 'Residential', active: 'Yes' },
      { name: 'Repair', resolution: 'Return Same Day', serviceType: 'Residential', active: 'Yes' },
      { name: 'Missed Pickup', resolution: 'Completed', serviceType: 'Residential', active: 'Yes' },
      { name: 'Remove', resolution: 'Completed', serviceType: 'Commercial', active: 'Yes' },
    ],
  },

  aggregatedTips: {
    title: 'Aggregated Truck and Tips',
    newLabel: 'New Aggregated Tip',
    singular: 'Aggregated Tip',
    listColumns: [
      { key: 'date', label: 'Date' },
      { key: 'truck', label: 'Truck' },
      { key: 'tips', label: 'Tips' },
      { key: 'tons', label: 'Tons' },
    ],
    sections: [
      {
        title: 'Summary',
        fields: [
          { key: 'date', label: 'Route Date', type: 'date', required: true },
          { key: 'truck', label: 'Truck', type: 'lookup', required: true },
          { key: 'tips', label: 'Tip Count', type: 'number' },
          { key: 'tons', label: 'Tons', type: 'number' },
          { key: 'dispatch', label: 'Dispatch', type: 'lookup' },
        ],
      },
    ],
    sample: [
      { date: '2026-07-01', truck: 'TRK-201', tips: 84, tons: '12.4' },
      { date: '2026-07-01', truck: 'TRK-102', tips: 61, tons: '9.1' },
      { date: '2026-06-30', truck: 'TRK-115', tips: 42, tons: '18.7' },
    ],
  },

  individualTips: {
    title: 'Individual Tip / Non-Tip',
    newLabel: 'New Tip',
    singular: 'Tip',
    listColumns: [
      { key: 'id', label: 'Tip #' },
      { key: 'asset', label: 'Asset' },
      { key: 'type', label: 'Type' },
      { key: 'timestamp', label: 'Timestamp' },
    ],
    sections: [
      {
        title: 'Tip Detail',
        fields: [
          { key: 'id', label: 'Tip Number', type: 'readonly' },
          { key: 'asset', label: 'Asset', type: 'lookup' },
          { key: 'type', label: 'Tip Type', type: 'select', options: ['Tip', 'Non-Tip'] },
          { key: 'timestamp', label: 'Timestamp', type: 'datetime' },
          { key: 'truck', label: 'Truck', type: 'lookup' },
          { key: 'location', label: 'Location', type: 'lookup' },
        ],
      },
    ],
    sample: [
      { id: 'TIP-90012', asset: 'CART-000123', type: 'Tip', timestamp: '2026-07-01 07:14' },
      { id: 'TIP-90013', asset: 'CART-000124', type: 'Tip', timestamp: '2026-07-01 07:22' },
      { id: 'TIP-90014', asset: 'BIN-002210', type: 'Non-Tip', timestamp: '2026-07-01 08:01' },
      { id: 'TIP-90015', asset: 'CART-000123', type: 'Tip', timestamp: '2026-07-01 08:18' },
    ],
  },
};

