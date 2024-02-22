
// Note: this is for rapid prototyping and might be not be accurate, and certainly isn't compleete.
const carrierCodes = [
  {
    'name': 'Vodafone UK',
    'country': 'UK',
    'prefix': '894410',
    'codes': ['23415']
  },
  {
    'name': 'Orange UK',
    'country': 'UK',
    'prefix': '894412',
    'codes': ['23433']
  },
  {
    'name': '3 UK',
    'country': 'UK',
    'prefix': '894420',
    'codes': ['23420']
  },
  {
    'name': 'T-Mobile UK',
    'country': 'UK',
    'prefix': '894430',
    'codes': ['23430']
  },
  {
    'name': 'Telstra',
    'country': 'Australia',
    'prefix': '50501',
    'codes': ['01']
  },
  {
    'name': 'Optus',
    'country': 'Australia',
    'prefix': '50502',
    'codes': ['02']
  },
  {
    'name': 'Vodafone AU',
    'country': 'Australia',
    'prefix': '50503',
    'codes': ['03']
  },
  {
    'name': 'Singtel',
    'country': 'Singapore',
    'prefix': '52501',
    'codes': ['01']
  },
  {
    'name': 'StarHub',
    'country': 'Singapore',
    'prefix': '52505',
    'codes': ['05']
  },
  {
    'name': 'M1',
    'country': 'Singapore',
    'prefix': '52503',
    'codes': ['03']
  },
  {
    'name': 'NTT Docomo',
    'country': 'Japan',
    'prefix': '44010',
    'codes': ['10']
  },
  {
    'name': 'SoftBank',
    'country': 'Japan',
    'prefix': '44020',
    'codes': ['20']
  },
  {
    'name': 'KDDI',
    'country': 'Japan',
    'prefix': '44050',
    'codes': ['50']
  },
  {
    'name': 'AT&T',
    'country': 'US',
    'prefix': '8901',
    'codes': ['030', '280', '150', '170', '410', '560', '680']
  },
  {
    'name': 'T-Mobile',
    'country': 'US',
    'prefix': '8901',
    'codes': ['026', '160', '260', '490']
  },
  {
    'name': 'Verizon',
    'country': 'US',
    'prefix': '8914',
    'codes': ['004', '005', '012', '480']
  }
]

const getCarrierName = (code: string) => {
  const matchPrefix = carrierCodes.find(obj => obj.prefix == code) 
  const matchMNC = carrierCodes.find(obj => obj.codes.includes(code.slice(3)))

  if (matchPrefix)
    return matchPrefix.name
  else if (matchMNC)
    return matchMNC.name
  else 
    return code
}

export {getCarrierName}


