type AcademicWrapperProps = {
  children: React.ReactNode
}

export const AcademicWrapper = ({ children }: AcademicWrapperProps) => (
  <div className="font-serif text-academic-primary bg-white p-8 rounded-lg shadow-academic">
    <div className="border-l-4 border-academic-accent pl-4">
      {children}
    </div>
  </div>
) 