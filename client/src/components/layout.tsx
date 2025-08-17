import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from '@clerk/clerk-react'
import type { ReactNode } from 'react'

// const DotIcon = () => {
//   return (
//     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
//       <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
//     </svg>
//   )
// }

function Layout ({ children }: {
    children: ReactNode,
}) {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">ごはんお願い</h1>
          <p className="text-lg text-muted-foreground">家族の食事申し込みを簡単管理</p>
        </div>
        <SignedOut>
	  <div className="flex justify-center mb-4">
            <SignInButton />
	  </div>
        </SignedOut>
        <SignedIn>
	  <div className="flex justify-center mb-4">
            <UserButton />
	  </div>
	  { children }
        </SignedIn>
      </div>
    </main>
  )
};

export default Layout;
