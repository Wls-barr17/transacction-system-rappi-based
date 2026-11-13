import { Link } from "react-router-dom"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button.tsx"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

// Página 404 construida con los componentes shadcn Empty + Avatar + Button
export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4" data-testid="not-found">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <div className="flex -space-x-3" aria-hidden="true">
              {["🍕", "🍣", "🍔"].map((emoji) => (
                <Avatar key={emoji} className="size-12 border-2 border-background">
                  <AvatarFallback className="text-xl">{emoji}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </EmptyMedia>
          <p className="font-display text-7xl font-extrabold text-primary">404</p>
          <EmptyTitle role="heading" aria-level={1}>
            Esta página no existe
          </EmptyTitle>
          <EmptyDescription>
            Revisa la dirección o vuelve al inicio para seguir pidiendo.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/">Ir al inicio</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </main>
  )
}

export default NotFoundPage
