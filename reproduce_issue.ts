
interface Registration {
    id: string | number;
    studentNumber: string;
    lastname: string;
    othername: string;
    firstname: string;
}

interface SchoolData {
    lCode: string;
    schCode: string;
    lgaCode: string;
}

const schoolsData: SchoolData[] = [
    { lCode: "1", schCode: "005", lgaCode: "1" }
];

const normalize = (s: string) => s.trim().toUpperCase();

const recomputeStudentNumbers = (
    lga: string,
    sch: string,
    regs: Registration[]
): Registration[] => {
    const school = schoolsData.find((s) => s.lCode === lga && s.schCode === sch);
    if (!school) return regs;

    // Sort registrations by surname, then by first name
    const sortedRegs = [...regs].sort((a, b) => {
        const surnameCompare = normalize(a.lastname).localeCompare(normalize(b.lastname));
        if (surnameCompare !== 0) return surnameCompare;
        // If surnames are the same, sort by first name
        return normalize(a.firstname).localeCompare(normalize(b.firstname));
    });

    const allSurnames = sortedRegs.map((r) => normalize(r.lastname));
    const uniqueSurnames = Array.from(new Set(allSurnames)).sort((a, b) => a.localeCompare(b));

    const x = school.lgaCode;
    const fff = school.schCode.toString().padStart(3, '0');

    return sortedRegs.map((r, index) => {
        const normalizedSurname = normalize(r.lastname);
        const surnameRank = uniqueSurnames.indexOf(normalizedSurname) + 1;

        // Use sequential numbering based on overall alphabetical order
        // Adams, Bob → 0001, Smith, John → 0002, Smith, Jane → 0003
        const uniqueNumber = index + 1;
        const nnnn = uniqueNumber.toString().padStart(4, '0');

        return {
            ...r,
            studentNumber: `${x}${fff}${nnnn}`,
        };
    });
};

// Test Case 1: Same Surname, Same Firstname, Different/No Middle Name
const regs1: Registration[] = [
    { id: 1, studentNumber: "", lastname: "Adams", firstname: "John", othername: "Quincy" },
    { id: 2, studentNumber: "", lastname: "Adams", firstname: "John", othername: "" },
];

console.log("Test Case 1: Same Surname, Same Firstname");
const result1 = recomputeStudentNumbers("1", "005", regs1);
result1.forEach(r => console.log(`${r.lastname}, ${r.firstname} ${r.othername} -> ${r.studentNumber}`));

// Test Case 2: Reversed Input Order
const regs2: Registration[] = [
    { id: 2, studentNumber: "", lastname: "Adams", firstname: "John", othername: "" },
    { id: 1, studentNumber: "", lastname: "Adams", firstname: "John", othername: "Quincy" },
];

console.log("\nTest Case 2: Reversed Input Order");
const result2 = recomputeStudentNumbers("1", "005", regs2);
result2.forEach(r => console.log(`${r.lastname}, ${r.firstname} ${r.othername} -> ${r.studentNumber}`));
