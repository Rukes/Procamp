import { useTitle } from "../hooks/useTitle";
import { useNavigate } from "react-router-dom";

export default function AuthorPage() {
  useTitle("O autorovi");
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">O autorovi</h1>

      <div className="max-w-2xl bg-white rounded-xl border border-gray-200 p-8 space-y-6 text-gray-700 leading-relaxed">
        <p>
          Cílem rezervačního systému <strong>MůjKemp.cz</strong> je naprogramovat běžným pronajímatelům
          jednoduchý systém pouze za provozní poplatek. Vývoj obdobného systému stojí desetitisíce
          až statisíce korun a je následně náročný na údržbu. Rozhodl jsem se na popud známého
          takový systém vytvořit jako open source, protože je celý naprogramovaný pomocí Anthropic Claude.
        </p>
        <div>
          <p className="mb-2">Poděkování:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              za tvorbu grafických podkladů a loga{" "}
              <a href="https://grafikasevcik.cz" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Štěpánu Ševčíkovi
              </a>
            </li>
            <li>za pomoc se správou VPS Michalovi Řeznikovi</li>
          </ul>
        </div>
        <p>
          Cena systému je stanovena pouze za provoz, nikoli za vývoj. Není mým účelem vydělat —
          pokud mi zbyde pár korun na kafe, tak je to samozřejmě bonus. Za to díky!
        </p>

        <div className="border-t border-gray-100 pt-6 space-y-3">
          <div className="flex items-center gap-3">
            <i className="fa-regular fa-user text-gray-400 w-4 text-center" />
            <span className="font-medium text-gray-900">Samuel Kunert</span>
          </div>
          <div className="flex items-center gap-3">
            <i className="fa-regular fa-globe text-gray-400 w-4 text-center" />
            <a
              href="https://www.kunerts.cz/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              www.kunerts.cz
            </a>
          </div>
          <div className="flex items-center gap-3">
            <i className="fa-regular fa-envelope text-gray-400 w-4 text-center" />
            <a
              href="mailto:samuel@kunerts.cz"
              className="text-blue-600 hover:underline"
            >
              samuel@kunerts.cz
            </a>
          </div>
          <div className="flex items-center gap-3">
            <i className="fa-brands fa-github text-gray-400 w-4 text-center" />
            <a
              href="https://github.com/Rukes/Procamp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Github repo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
