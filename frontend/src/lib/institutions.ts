export interface Institution {
  id: string
  name: string
  short: string
  color: string
  domains: string
  locations: string
}

export const INSTITUTIONS: readonly Institution[] = [
  {
    id: 'mdh',
    name: 'MediaDesign Hochschule',
    short: 'MDH',
    color: '#2574A9',
    domains: 'mdh.de',
    locations: 'Berlin, Munich, Düsseldorf',
  },
  {
    id: 'tum',
    name: 'Technische Universität München',
    short: 'TUM',
    color: '#1B6E3C',
    domains: 'tum.de',
    locations: 'Munich',
  },
  {
    id: 'uhh',
    name: 'Universität Hamburg',
    short: 'UHH',
    color: '#8B5A2B',
    domains: 'uni-hamburg.de',
    locations: 'Hamburg',
  },
  {
    id: 'rwth',
    name: 'RWTH Aachen',
    short: 'RWTH',
    color: '#A22633',
    domains: 'rwth-aachen.de',
    locations: 'Aachen',
  },
] as const

export const DEFAULT_INSTITUTION_ID = 'mdh'

export function getInstitution(id: string | null | undefined): Institution {
  return (
    INSTITUTIONS.find((item) => item.id === id) ??
    INSTITUTIONS.find((item) => item.id === DEFAULT_INSTITUTION_ID)!
  )
}
