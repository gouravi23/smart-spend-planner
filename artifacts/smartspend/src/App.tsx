import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Expenses from "@/pages/Expenses";
import Budget from "@/pages/Budget";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/register">
        {isAuthenticated ? <Redirect to="/" /> : <Register />}
      </Route>
      <Route path="/">
        {isAuthenticated ? (
          <Layout><Dashboard /></Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/expenses">
        {isAuthenticated ? (
          <Layout><Expenses /></Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/budget">
        {isAuthenticated ? (
          <Layout><Budget /></Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/analytics">
        {isAuthenticated ? (
          <Layout><Analytics /></Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
