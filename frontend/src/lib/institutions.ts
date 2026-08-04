export interface Institution {
  id: string
  name: string
  short: string
  color: string
  /** Primary domain shown in the picker */
  domains: string
  locations: string
  /** Email domains accepted for this campus (demo + validation). */
  emailDomains: string[]
}

export const INSTITUTIONS: Institution[] = [
  {
    id: 'mdh',
    name: 'MediaDesign Hochschule',
    short: 'MDH',
    color: '#2574A9',
    domains: 'mdh.de',
    locations: 'Berlin, Munich, Düsseldorf',
    emailDomains: [
      'mdh.de',
      'stud.mdh.de',
      'mdh-berlin.de',
      'stud.mdh-berlin.de',
      'campus.edu',
      'university.edu',
    ],
  },
  {
    id: 'tum',
    name: 'Technische Universität München',
    short: 'TUM',
    color: '#1B6E3C',
    domains: 'tum.de',
    locations: 'Munich',
    emailDomains: ['tum.de', 'stud.tum.de', 'campus.edu', 'university.edu'],
  },
  {
    id: 'uhh',
    name: 'Universität Hamburg',
    short: 'UHH',
    color: '#8B5A2B',
    domains: 'uni-hamburg.de',
    locations: 'Hamburg',
    emailDomains: [
      'uni-hamburg.de',
      'stud.uni-hamburg.de',
      'campus.edu',
      'university.edu',
    ],
  },
  {
    id: 'rwth',
    name: 'RWTH Aachen',
    short: 'RWTH',
    color: '#A22633',
    domains: 'rwth-aachen.de',
    locations: 'Aachen',
    emailDomains: [
      'rwth-aachen.de',
      'stud.rwth-aachen.de',
      'campus.edu',
      'university.edu',
    ],
  },
]

export const DEFAULT_INSTITUTION_ID = INSTITUTIONS[0].id

export function findInstitution(id: string | null | undefined): Institution {
  return (
    INSTITUTIONS.find((item) => item.id === id) ??
    INSTITUTIONS.find((item) => item.id === DEFAULT_INSTITUTION_ID)!
  )
}

export function institutionEmailHint(institution: Institution): string {
  const primary =
    institution.emailDomains.find((d) => d.startsWith('stud.')) ??
    institution.emailDomains[0]
  return `you@${primary}`
}
