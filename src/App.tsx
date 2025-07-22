import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";

// Layouts
import MainLayout from "./layouts/MainLayout";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import AcceptInvitation from "./pages/AcceptInvitation";
import AuthConfirm from "./pages/AuthConfirm";
import Members from "./pages/Members";
import MemberDetail from "./pages/MemberDetail";
import Books from "./pages/Books";
import BookDetail from "./pages/BookDetail";
import Circulation from "./pages/Circulation";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/confirm" element={<AuthConfirm />} />
          <Route path="/accept-invitation/:id" element={<AcceptInvitation />} />

          <Route element={<MainLayout />}>
            <Route index element={<Home />} />

            <Route element={<ProtectedRoute resource="books" action="view" />}>
              <Route path="/books" element={<Books />} />
              <Route path="/books/:id" element={<BookDetail />} />
            </Route>

            <Route
              element={<ProtectedRoute resource="members" action="view" />}
            >
              <Route path="/members" element={<Members />} />
              <Route path="/members/:id" element={<MemberDetail />} />
            </Route>

            <Route
              element={
                <ProtectedRoute resource="circulation" action="manage" />
              }
            >
              <Route path="/circulation" element={<Circulation />} />
            </Route>



            <Route
              element={<ProtectedRoute resource="members" action="create" />}
            >
              <Route path="/admin" element={<AdminPanel />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
