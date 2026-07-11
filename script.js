// =========================================================
// MATCH UNMSM - SCRIPT CORREGIDO - PARTE 1
// =========================================================

// 1. SELECTOR DINÁMICO DE BOTONES (TAGS)
function toggleSeleccion(boton) {
    boton.classList.toggle("selected");
    if (boton.classList.contains("selected")) {
        boton.classList.remove("bg-slate-950", "border-slate-800");
        boton.classList.add("bg-gradient-to-r", "from-pink-500", "to-purple-600", "text-white", "border-transparent");
    } else {
        boton.classList.add("bg-slate-950", "border-slate-800");
        boton.classList.remove("bg-gradient-to-r", "from-pink-500", "to-purple-600", "text-white", "border-transparent");
    }
}

// 2. CONTROL DE NAVEGACIÓN Y VISIBILIDAD DE BOTONES
// Esta función debe llamarse al final de tus funciones nextStep y prevStep
function actualizarVisibilidadBotones(pasoActual, totalPasos) {
    const btnGuardar = document.getElementById('btnGuardar');
    const btnSiguiente = document.getElementById('btnSiguiente'); 

    if (pasoActual === totalPasos) {
        if (btnGuardar) btnGuardar.classList.remove('hidden');
        if (btnSiguiente) btnSiguiente.classList.add('hidden');
    } else {
        if (btnGuardar) btnGuardar.classList.add('hidden');
        if (btnSiguiente) btnSiguiente.classList.remove('hidden');
    }
}

// 3. OBTENER VALORES DE LOS CONTENEDORES
function obtenerValoresPorContenedor(id) {
    const contenedor = document.getElementById(id);
    if (!contenedor) return [];
    return Array.from(contenedor.querySelectorAll(".selected")).map(b => b.dataset.val);
}

// 4. LIMPIAR TODO
function limpiarSeleccion() {
    document.querySelectorAll(".selected").forEach(boton => {
        boton.classList.remove("selected", "bg-gradient-to-r", "from-pink-500", "to-purple-600", "text-white", "border-transparent");
        boton.classList.add("bg-slate-950", "border-slate-800");
    });
}

function reiniciarFormulario() {
    document.getElementById("matchForm").reset();
    limpiarSeleccion();
    document.getElementById("resultadoSection").classList.add("hidden");
    document.getElementById("matchForm").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// =========================================================
// AVISAME CUANDO ESTES LISTO PARA LA PARTE 2
// (Contendrá el registro a Supabase y el algoritmo de Match)
// =========================================================
// =========================================================
// MATCH UNMSM - SCRIPT CORREGIDO - PARTE 2
// =========================================================

// 5. REGISTRO Y CÁLCULO (Disparado por el submit del formulario)
async function registrarYCalcular(event) {
    event.preventDefault();
    const boton = document.getElementById("btnGuardar");
    const textoOriginal = boton.innerHTML;

    boton.disabled = true;
    boton.innerHTML = "🔥 Procesando...";

    try {
        const nuevoUsuario = {
            nombre: document.getElementById("nombre").value.trim(),
            edad: Number(document.getElementById("edad").value),
            genero: document.getElementById("genero").value,
            facultad: document.getElementById("facultad").value.trim(),
            base: document.getElementById("base").value.trim(),
            instagram: document.getElementById("instagram").value.trim(),
            trago: document.getElementById("trago").value,
            rango_edad_busca: document.getElementById("rangoEdad").value,
            soy: obtenerValoresPorContenedor("grupoComoSoy"),
            gustos: [...obtenerValoresPorContenedor("grupoFisico"), ...obtenerValoresPorContenedor("grupoSubjetivo"), ...obtenerValoresPorContenedor("grupoComida")]
        };

        const { error: errorInsertar } = await clienteSupabase.from("alumnos").insert([nuevoUsuario]);
        if (errorInsertar) throw errorInsertar;

        const { data: alumnos, error: errorBusqueda } = await clienteSupabase.from("alumnos").select("*");
        if (errorBusqueda) throw errorBusqueda;

        const matches = buscarMatches(nuevoUsuario, alumnos);
        
        // Ocultar formulario y mostrar resultados
        document.getElementById("matchForm").classList.add("hidden");
        mostrarResultados(matches);

    } catch (error) {
        console.error("Error:", error);
        alert("Ocurrió un error: " + error.message);
    } finally {
        boton.disabled = false;
        boton.innerHTML = textoOriginal;
    }
}

// 6. ALGORITMO DE MATCH
function calcularCompatibilidad(usuario, persona) {
    let puntos = 0, total = 0;
    
    // Cruce de edades
    const miRango = usuario.rango_edad_busca.split("-").map(Number);
    const suRango = (persona.rango_edad_busca || "18-25").split("-").map(Number);
    
    total += 4;
    if (persona.edad >= miRango[0] && persona.edad <= miRango[1]) puntos += 2;
    if (usuario.edad >= suRango[0] && usuario.edad <= suRango[1]) puntos += 2;

    // Gustos (Lógica simplificada)
    const atributosComunes = usuario.gustos?.filter(g => persona.gustos?.includes(g)) || [];
    total += 10;
    puntos += (atributosComunes.length * 2);

    return Math.min(Math.round((puntos / total) * 100), 100);
}

function buscarMatches(usuario, alumnos) {
    return alumnos
        .filter(p => p.instagram.toLowerCase() !== usuario.instagram.toLowerCase())
        .map(p => ({ ...p, porcentaje: calcularCompatibilidad(usuario, p) }))
        .filter(p => p.porcentaje >= 40)
        .sort((a, b) => b.porcentaje - a.porcentaje)
        .slice(0, 2);
}

// 7. RENDERIZADO DE RESULTADOS
function mostrarResultados(matches) {
    const seccion = document.getElementById("resultadoSection");
    const contenedor = document.getElementById("contenedorMatches");
    
    seccion.classList.remove("hidden");
    contenedor.innerHTML = matches.length > 0 ? matches.map((persona, i) => `
        <div class="bg-slate-950 border border-pink-500/30 rounded-2xl p-5 mb-4">
            <h3 class="text-xl font-black text-pink-400">${i === 0 ? "🥇 Mejor Match" : "🥈 Segundo Match"}</h3>
            <p class="text-white font-bold">${persona.nombre}</p>
            <p class="text-sm text-slate-400">🔥 Compatibilidad: ${persona.porcentaje}%</p>
            <a href="https://instagram.com/${persona.instagram.replace("@", "").trim()}" target="_blank" class="text-pink-400 font-bold underline">📸 ${persona.instagram}</a>
        </div>
    `).join('') : '<p class="text-center text-slate-500">No hay coincidencias > 40%.</p>';
}

// Inicialización final
document.getElementById("matchForm").addEventListener("submit", registrarYCalcular);
