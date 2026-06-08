import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Memorize from "@/pages/Memorize";
import Hints from "@/pages/Hints";
import UndoPage from "@/pages/UndoPage";
import Export from "@/pages/Export";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="memorize" element={<Memorize />} />
          <Route path="hints" element={<Hints />} />
          <Route path="undo" element={<UndoPage />} />
          <Route path="export" element={<Export />} />
        </Route>
      </Routes>
    </Router>
  );
}
