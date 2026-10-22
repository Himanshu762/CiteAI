/**
 * Academic fields from the OpenAlex taxonomy (https://api.openalex.org/fields).
 * The id is the OpenAlex field id used in `primary_topic.field.id` filters.
 */

export interface Discipline {
    id: string;
    name: string;
    domain: 'Physical Sciences' | 'Life Sciences' | 'Health Sciences' | 'Social Sciences';
}

export const DISCIPLINES: Discipline[] = [
    { id: '11', name: 'Agricultural and Biological Sciences', domain: 'Life Sciences' },
    { id: '12', name: 'Arts and Humanities', domain: 'Social Sciences' },
    { id: '13', name: 'Biochemistry, Genetics and Molecular Biology', domain: 'Life Sciences' },
    { id: '14', name: 'Business, Management and Accounting', domain: 'Social Sciences' },
    { id: '15', name: 'Chemical Engineering', domain: 'Physical Sciences' },
    { id: '16', name: 'Chemistry', domain: 'Physical Sciences' },
    { id: '17', name: 'Computer Science', domain: 'Physical Sciences' },
    { id: '18', name: 'Decision Sciences', domain: 'Social Sciences' },
    { id: '19', name: 'Earth and Planetary Sciences', domain: 'Physical Sciences' },
    { id: '20', name: 'Economics, Econometrics and Finance', domain: 'Social Sciences' },
    { id: '21', name: 'Energy', domain: 'Physical Sciences' },
    { id: '22', name: 'Engineering', domain: 'Physical Sciences' },
    { id: '23', name: 'Environmental Science', domain: 'Physical Sciences' },
    { id: '24', name: 'Immunology and Microbiology', domain: 'Life Sciences' },
    { id: '25', name: 'Materials Science', domain: 'Physical Sciences' },
    { id: '26', name: 'Mathematics', domain: 'Physical Sciences' },
    { id: '27', name: 'Medicine', domain: 'Health Sciences' },
    { id: '28', name: 'Neuroscience', domain: 'Life Sciences' },
    { id: '29', name: 'Nursing', domain: 'Health Sciences' },
    { id: '30', name: 'Pharmacology, Toxicology and Pharmaceutics', domain: 'Life Sciences' },
    { id: '31', name: 'Physics and Astronomy', domain: 'Physical Sciences' },
    { id: '32', name: 'Psychology', domain: 'Social Sciences' },
    { id: '33', name: 'Social Sciences', domain: 'Social Sciences' },
    { id: '34', name: 'Veterinary', domain: 'Health Sciences' },
    { id: '35', name: 'Dentistry', domain: 'Health Sciences' },
    { id: '36', name: 'Health Professions', domain: 'Health Sciences' },
];

export function disciplineName(id: string | undefined): string | undefined {
    return DISCIPLINES.find(d => d.id === id)?.name;
}
