import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bot, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/apprendre")({
  head: () => ({
    meta: [
      { title: "Mode Étudiant & Apprentissage — CyberSafe Online" },
      { name: "description", content: "L'espace apprentissage est désormais intégré directement dans l'Assistant CyberSafe avec commandes /." },
    ],
  }),
  component: RedirectToAssistant,
});

function RedirectToAssistant() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ to: "/assistant" });
    }, 800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="max-w-xl mx-auto py-16 space-y-6 text-center animate-rise">
      <div className="grid size-16 mx-auto place-items-center rounded-2xl bg-primary/10 text-primary shadow-glow ring-1 ring-primary/20">
        <GraduationCap className="size-8" />
      </div>
      <h1 className="text-2xl font-bold font-display">
        L'apprentissage est maintenant dans l'Assistant CyberSafe
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Téléversez vos cours en PDF ou texte dans n'importe quelle matière (Maths, Droit, Informatique, Cybersécurité, Sciences, etc.), générez un plan selon votre date d'examen, passez des quiz interactifs et révisez directement dans l'Assistant avec les commandes <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">/apprendre</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">/plan</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">/quiz</code>, et <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">/resume</code>.
      </p>
      <div>
        <Button
          variant="hero"
          size="lg"
          onClick={() => navigate({ to: "/assistant" })}
          className="gap-2"
        >
          <Bot className="size-4" /> Accéder à l'Assistant Étudiant <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
