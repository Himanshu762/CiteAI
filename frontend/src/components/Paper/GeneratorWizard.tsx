import { useState } from "react"
import { Stepper } from "../../components/ui/components"
import { Button } from "../../components/ui/components"
import { Input } from "../../components/ui/components"

type WizardStepProps = {
  onComplete?: () => void
  onBack?: () => void
}

const ParameterGrid = ({ onBack }: WizardStepProps) => {
  const [setting, setSetting] = useState("")
  
  return (
    <div className="space-y-6">
      <Button onClick={onBack}>Back</Button>
    </div>
  )
}

const TopicInput = ({ onComplete }: WizardStepProps) => {
  const [topic, setTopic] = useState("")
  
  return (
    <div className="space-y-6">
      <Input 
        placeholder="Enter your paper subject..." 
        className="w-full"
        maxLength={500}
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <Button onClick={onComplete} className="ml-auto">
        Continue
      </Button>
    </div>
  )
}

export const GeneratorWizard = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const steps = ["Topic", "Parameters", "Review", "Output"]
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Stepper 
        steps={steps} 
        currentStep={currentStep-1}
        onChange={(step) => setCurrentStep(step+1)}
      />
      
      <div className="mt-12 space-y-8">
        {currentStep === 1 && (
          <TopicInput onComplete={() => setCurrentStep(2)} />
        )}
        
        {currentStep === 2 && (
          <ParameterGrid onBack={() => setCurrentStep(1)} />
        )}
      </div>
    </div>
  )
} 