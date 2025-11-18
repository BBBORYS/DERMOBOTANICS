// ========================================
// CONFIGURACIÓN SUPABASE
// ========================================
const SUPABASE_URL = 'https://llrirxgdeofkedwwvwzz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxscmlyeGdkZW9ma2Vkd3d2d3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzA5NTQsImV4cCI6MjA3ODkwNjk1NH0.D4POM0yrlN7UgAQkrOhON8USHcjOKpKh9euHmQwAG5E';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========================================
// CONFIGURACIÓN
// ========================================
const CLAVE_CORRECTA = "admin124";

// ========================================
// ELEMENTOS DEL DOM
// ========================================
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('errorMsg');
const hamburgerIcon = document.getElementById('hamburgerIcon');
const menuNav = document.getElementById('menuNav');
const btnIniciar = document.getElementById('btnIniciar');
const btnCerrar = document.getElementById('btnCerrar');
const btnVolverCategorias = document.getElementById('btnVolverCategorias');
const btnAgregarFlotante = document.getElementById('btnAgregarFlotante');

// Modales Categoría
const modalCategoria = document.getElementById('modalCategoria');
const formCategoria = document.getElementById('formCategoria');
const imagePreviewCategoria = document.getElementById('imagePreviewCategoria');
const previewImageCategoria = document.getElementById('previewImageCategoria');
const fileInputLabelCategoria = document.getElementById('fileInputLabelCategoria');

// Modales Item
const modalItem = document.getElementById('modalItem');
const formItem = document.getElementById('formItem');
const imagePreviewItem = document.getElementById('imagePreviewItem');
const previewImageItem = document.getElementById('previewImageItem');
const fileInputLabelItem = document.getElementById('fileInputLabelItem');

// ========================================
// ESTADO DE LA APLICACIÓN
// ========================================
let sesionActiva = false;
let imagenActualCategoria = null;
let imagenActualItem = null;
let categoriaActual = null; // Para saber si estamos viendo items de una categoría
let btnAgregarItem = null; // Se creará dinámicamente

// ========================================
// INICIALIZACIÓN
// ========================================
window.addEventListener('DOMContentLoaded', () => {
    const sesion = sessionStorage.getItem('sesionActiva');
    
    if (sesion === 'true') {
        sesionActiva = true;
    }
    
    actualizarMenu();
    loginModal.classList.add('hidden');
    modalCategoria.classList.add('hidden');
    modalItem.classList.add('hidden');
    
    cargarCategorias();
    
    // Event listeners para preview de imágenes
    document.getElementById('categoriaImagen').addEventListener('change', function(e) {
        mostrarPreviewImagen(e.target.files[0], 'categoria');
    });
    
    document.getElementById('itemImagen').addEventListener('change', function(e) {
        mostrarPreviewImagen(e.target.files[0], 'item');
    });

    // Crear botón flotante para agregar items (inicialmente oculto)
    crearBotonAgregarItem();
});

// ========================================
// FUNCIONES DE IMÁGENES
// ========================================
function mostrarPreviewImagen(file, tipo) {
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (tipo === 'categoria') {
                previewImageCategoria.src = e.target.result;
                imagePreviewCategoria.style.display = 'block';
                fileInputLabelCategoria.classList.add('has-image');
                imagenActualCategoria = file;
            } else {
                previewImageItem.src = e.target.result;
                imagePreviewItem.style.display = 'block';
                fileInputLabelItem.classList.add('has-image');
                imagenActualItem = file;
            }
        }
        reader.readAsDataURL(file);
    }
}

async function subirImagen(file, carpeta = 'productos') {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${carpeta}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('productos')
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('productos')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        throw error;
    }
}

async function eliminarImagen(url) {
    try {
        const pathSegments = url.split('/');
        const internalPath = pathSegments.slice(pathSegments.indexOf('productos') + 1).join('/');
        
        const { error } = await supabase.storage
            .from('productos')
            .remove([internalPath]);

        if (error) throw error;
    } catch (error) {
        console.error('Error eliminando imagen:', error);
    }
}

// ========================================
// FUNCIONES SUPABASE - CATEGORÍAS
// ========================================
async function cargarCategorias() {
    try {
        const { data: categorias, error } = await supabase
            .from('categorias')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderizarCategorias(categorias || []);
        
        categoriaActual = null;
        btnVolverCategorias.classList.remove('visible');
        
        if (sesionActiva) {
            btnAgregarFlotante.classList.add('visible');
            btnAgregarFlotante.textContent = '➕ Agregar Categoría';
            if (btnAgregarItem) btnAgregarItem.classList.remove('visible');
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
        alert('Error al cargar las categorías');
    }
}

async function agregarCategoria(categoria) {
    try {
        const { data, error } = await supabase
            .from('categorias')
            .insert([categoria])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error agregando categoría:', error);
        throw error;
    }
}

async function actualizarCategoria(id, datos) {
    try {
        const { data, error } = await supabase
            .from('categorias')
            .update(datos)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        throw error;
    }
}

async function eliminarCategoriaDB(id) {
    try {
        // Eliminar imagen de la categoría
        const { data: categoria } = await supabase
            .from('categorias')
            .select('imagen_url')
            .eq('id', id)
            .single();

        if (categoria && categoria.imagen_url) {
            await eliminarImagen(categoria.imagen_url);
        }

        // Eliminar items relacionados
        const { data: items } = await supabase
            .from('items')
            .select('imagen_url')
            .eq('categoria_id', id);

        if (items && items.length > 0) {
            for (const item of items) {
                if (item.imagen_url) {
                    await eliminarImagen(item.imagen_url);
                }
            }
        }

        await supabase.from('items').delete().eq('categoria_id', id);

        // Eliminar categoría
        const { error } = await supabase
            .from('categorias')
            .delete()
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        throw error;
    }
}

// ========================================
// FUNCIONES SUPABASE - ITEMS
// ========================================
async function cargarItems(categoriaId) {
    try {
        const { data: items, error } = await supabase
            .from('items')
            .select('*')
            .eq('categoria_id', categoriaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        categoriaActual = categoriaId;
        renderizarItems(items || []);
        
        btnVolverCategorias.classList.add('visible');
        
        if (sesionActiva) {
            btnAgregarFlotante.classList.remove('visible');
            if (btnAgregarItem) btnAgregarItem.classList.add('visible');
        }
    } catch (error) {
        console.error('Error cargando items:', error);
        alert('Error al cargar los productos');
    }
}

async function agregarItem(item) {
    try {
        const { data, error } = await supabase
            .from('items')
            .insert([item])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error agregando item:', error);
        throw error;
    }
}

async function actualizarItem(id, datos) {
    try {
        const { data, error } = await supabase
            .from('items')
            .update(datos)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error actualizando item:', error);
        throw error;
    }
}

async function eliminarItemDB(id) {
    try {
        const { data: item } = await supabase
            .from('items')
            .select('imagen_url')
            .eq('id', id)
            .single();

        if (item && item.imagen_url) {
            await eliminarImagen(item.imagen_url);
        }

        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error('Error eliminando item:', error);
        throw error;
    }
}

// ========================================
// RENDERIZADO
// ========================================
function renderizarCategorias(categorias) {
    const productosContainer = document.getElementById('productosContainer');
    productosContainer.innerHTML = '';
    
    if (categorias.length === 0) {
        productosContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #666; font-size: 1.2rem;">No hay categorías disponibles</p>';
        return;
    }
    
    categorias.forEach(categoria => {
        const div = crearElementoCategoria(categoria);
        productosContainer.appendChild(div);
    });
}

function crearElementoCategoria(categoria) {
    const div = document.createElement('div');
    div.className = 'producto';
    div.setAttribute('data-id', categoria.id);
    
    // ✅ CORRECCIÓN: Se eliminó el style inline problemático
    const accionesClass = sesionActiva ? 'producto-actions visible' : 'producto-actions';
    
    div.innerHTML = `
        <div class="producto-img" onclick="verItems(${categoria.id})">
            <img src="${categoria.imagen_url}" alt="${categoria.nombre}" 
                onerror="this.src='https://via.placeholder.com/300x200?text=Imagen+No+Disponible'">
            <div class="producto-info">
                <h3>${categoria.nombre}</h3>
            </div>
        </div>
        <div class="${accionesClass}">
            <button class="btn-editar" onclick="event.stopPropagation(); editarCategoria(${categoria.id})">✏️ Editar</button>
            <button class="btn-eliminar" onclick="event.stopPropagation(); eliminarCategoria(${categoria.id})">🗑️ Eliminar</button>
        </div>
    `;
    return div;
}

function renderizarItems(items) {
    const productosContainer = document.getElementById('productosContainer');
    productosContainer.innerHTML = '';
    
    if (items.length === 0) {
        productosContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #666; font-size: 1.2rem;">No hay productos en esta categoría</p>';
        return;
    }
    
    // ⭐ DEPURACIÓN: Ver los datos que llegan
    console.log('=== ITEMS CARGADOS ===');
    console.log('Total items:', items.length);
    items.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
            id: item.id,
            nombre: item.nombre,
            descripcion: item.descripcion,
            tiene_descripcion: !!item.descripcion,
            descripcion_vacia: item.descripcion === '' || item.descripcion === null
        });
    });
    
    items.forEach(item => {
        const div = crearElementoItem(item);
        productosContainer.appendChild(div);
    });
}

function crearElementoItem(item) {
    const div = document.createElement('div');
    div.className = 'producto';
    div.setAttribute('data-id', item.id);
    
    const accionesClass = sesionActiva ? 'producto-actions visible' : 'producto-actions';
    
    // ⭐ PREPARAR DESCRIPCIÓN
    let descripcionTexto = '';
    let descripcionClass = '';
    
    if (item.descripcion && item.descripcion.trim() !== '') {
        descripcionTexto = item.descripcion.trim();
        descripcionClass = '';
    } else {
        descripcionTexto = 'Sin descripción';
        descripcionClass = ' class="sin-descripcion"';
    }
    
    // ⭐ DEPURACIÓN
    console.log(`Renderizando item "${item.nombre}":`, {
        descripcion_original: item.descripcion,
        descripcion_final: descripcionTexto
    });
    
    // ⭐ NUEVO HTML: Descripción FUERA de producto-img
    div.innerHTML = `
        <div class="producto-img">
            <img src="${item.imagen_url}" alt="${item.nombre}" 
                onerror="this.src='https://via.placeholder.com/300x200?text=Imagen+No+Disponible'">
            <div class="producto-info">
                <h3>${item.nombre}</h3>
            </div>
        </div>
        <div class="producto-descripcion">
            <p${descripcionClass}>${descripcionTexto}</p>
        </div>
        <div class="${accionesClass}">
            <button class="btn-editar" onclick="editarItem(${item.id})">✏️ Editar</button>
            <button class="btn-eliminar" onclick="eliminarItem(${item.id})">🗑️ Eliminar</button>
        </div>
    `;
    
    return div;
}

// ========================================
// NAVEGACIÓN
// ========================================
function verItems(categoriaId) {
    cargarItems(categoriaId);
}

btnVolverCategorias.addEventListener('click', (e) => {
    e.preventDefault();
    cargarCategorias();
});

// ========================================
// MANEJO DE SESIÓN
// ========================================
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const claveIngresada = passwordInput.value.trim();

    if (claveIngresada === CLAVE_CORRECTA) {
        sesionActiva = true;
        sessionStorage.setItem('sesionActiva', 'true');
        cerrarModalLogin();
        actualizarMenu();
        mostrarBotonesEdicion();
    } else {
        errorMsg.textContent = '❌ Clave incorrecta. Intenta de nuevo.';
        passwordInput.value = '';
        passwordInput.focus();
    }
});

function cerrarModalLogin() {
    loginModal.classList.add('hidden');
    errorMsg.textContent = '';
    passwordInput.value = '';
}

btnIniciar.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.classList.remove('hidden');
    passwordInput.focus();
    cerrarMenuHamburguesa();
});

btnCerrar.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        sesionActiva = false;
        sessionStorage.removeItem('sesionActiva');
        actualizarMenu();
        ocultarBotonesEdicion();
        cerrarMenuHamburguesa();
    }
});

// ========================================
// MENÚ HAMBURGUESA
// ========================================
hamburgerIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    hamburgerIcon.classList.toggle('active');
    menuNav.classList.toggle('active');
});

document.addEventListener('click', (e) => {
    if (!hamburgerIcon.contains(e.target) && !menuNav.contains(e.target)) {
        cerrarMenuHamburguesa();
    }
});

function cerrarMenuHamburguesa() {
    hamburgerIcon.classList.remove('active');
    menuNav.classList.remove('active');
}

// ========================================
// GESTIÓN DE INTERFAZ
// ========================================
function actualizarMenu() {
    if (sesionActiva) {
        btnIniciar.classList.add('hidden');
        btnCerrar.classList.remove('hidden');
    } else {
        btnIniciar.classList.remove('hidden');
        btnCerrar.classList.add('hidden');
    }
}

function mostrarBotonesEdicion() {
    const acciones = document.querySelectorAll('.producto-actions');
    acciones.forEach(accion => accion.classList.add('visible'));
    
    if (categoriaActual) {
        if (btnAgregarItem) btnAgregarItem.classList.add('visible');
        btnAgregarFlotante.classList.remove('visible');
    } else {
        btnAgregarFlotante.classList.add('visible');
        if (btnAgregarItem) btnAgregarItem.classList.remove('visible');
    }
}

function ocultarBotonesEdicion() {
    const acciones = document.querySelectorAll('.producto-actions');
    acciones.forEach(accion => accion.classList.remove('visible'));
    
    btnAgregarFlotante.classList.remove('visible');
    if (btnAgregarItem) btnAgregarItem.classList.remove('visible');
}

function crearBotonAgregarItem() {
    btnAgregarItem = document.createElement('button');
    btnAgregarItem.className = 'btn-agregar-item';
    btnAgregarItem.textContent = '➕ Agregar Producto';
    btnAgregarItem.onclick = abrirModalAgregarItem;
    document.body.appendChild(btnAgregarItem);
}

// ========================================
// GESTIÓN DE CATEGORÍAS (CRUD)
// ========================================
function abrirModalAgregar() {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para agregar categorías');
        return;
    }
    
    document.getElementById('tituloModalCategoria').textContent = 'Agregar Categoría';
    formCategoria.reset();
    document.getElementById('categoriaId').value = '';
    imagePreviewCategoria.style.display = 'none';
    fileInputLabelCategoria.classList.remove('has-image');
    imagenActualCategoria = null;
    modalCategoria.classList.remove('hidden');
}

function cerrarModalCategoria() {
    modalCategoria.classList.add('hidden');
    formCategoria.reset();
    imagePreviewCategoria.style.display = 'none';
    fileInputLabelCategoria.classList.remove('has-image');
    imagenActualCategoria = null;
}

async function editarCategoria(id) {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para editar categorías');
        return;
    }

    try {
        const { data: categoria, error } = await supabase
            .from('categorias')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('tituloModalCategoria').textContent = 'Editar Categoría';
        document.getElementById('categoriaId').value = categoria.id;
        document.getElementById('categoriaNombre').value = categoria.nombre;
        
        previewImageCategoria.src = categoria.imagen_url;
        imagePreviewCategoria.style.display = 'block';
        fileInputLabelCategoria.classList.add('has-image');
        
        imagenActualCategoria = null;
        modalCategoria.classList.remove('hidden');
    } catch (error) {
        console.error('Error cargando categoría:', error);
        alert('Error al cargar la categoría');
    }
}

async function eliminarCategoria(id) {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para eliminar categorías');
        return;
    }

    if (confirm('¿Está seguro? Esto eliminará la categoría y todos sus productos.')) {
        try {
            await eliminarCategoriaDB(id);
            await cargarCategorias();
        } catch (error) {
            alert('Error al eliminar la categoría');
        }
    }
}

formCategoria.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('categoriaId').value;
    const nombre = document.getElementById('categoriaNombre').value.trim();

    if (!id && !imagenActualCategoria) {
        alert('Por favor seleccione una imagen para la nueva categoría');
        return;
    }

    try {
        let imagen_url = previewImageCategoria.src;

        if (imagenActualCategoria) {
            if (id) {
                const { data: categoriaAnterior } = await supabase
                    .from('categorias')
                    .select('imagen_url')
                    .eq('id', id)
                    .single();
                    
                if (categoriaAnterior && categoriaAnterior.imagen_url) {
                    eliminarImagen(categoriaAnterior.imagen_url);
                }
            }
            imagen_url = await subirImagen(imagenActualCategoria, 'categorias');
        }

        const datosCategoria = {
            nombre: nombre,
            imagen_url: imagen_url
        };

        if (id) {
            await actualizarCategoria(id, datosCategoria);
        } else {
            await agregarCategoria(datosCategoria);
        }

        await cargarCategorias();
        cerrarModalCategoria();
    } catch (error) {
        alert('Error al guardar la categoría: ' + error.message);
    }
});

// ========================================
// GESTIÓN DE ITEMS (CRUD)
// ========================================
function abrirModalAgregarItem() {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para agregar productos');
        return;
    }
    
    document.getElementById('tituloModalItem').textContent = 'Agregar Producto';
    formItem.reset();
    document.getElementById('itemId').value = '';
    document.getElementById('itemCategoriaId').value = categoriaActual;
    imagePreviewItem.style.display = 'none';
    fileInputLabelItem.classList.remove('has-image');
    imagenActualItem = null;
    modalItem.classList.remove('hidden');
}

function cerrarModalItem() {
    modalItem.classList.add('hidden');
    formItem.reset();
    imagePreviewItem.style.display = 'none';
    fileInputLabelItem.classList.remove('has-image');
    imagenActualItem = null;
}

async function editarItem(id) {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para editar productos');
        return;
    }

    try {
        const { data: item, error } = await supabase
            .from('items')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('tituloModalItem').textContent = 'Editar Producto';
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemCategoriaId').value = item.categoria_id;
        document.getElementById('itemNombre').value = item.nombre;
        document.getElementById('itemDescripcion').value = item.descripcion || '';
        
        previewImageItem.src = item.imagen_url;
        imagePreviewItem.style.display = 'block';
        fileInputLabelItem.classList.add('has-image');
        
        imagenActualItem = null;
        modalItem.classList.remove('hidden');
    } catch (error) {
        console.error('Error cargando item:', error);
        alert('Error al cargar el producto');
    }
}

async function eliminarItem(id) {
    if (!sesionActiva) {
        alert('Debe iniciar sesión para eliminar productos');
        return;
    }

    if (confirm('¿Está seguro que desea eliminar este producto?')) {
        try {
            await eliminarItemDB(id);
            await cargarItems(categoriaActual);
        } catch (error) {
            alert('Error al eliminar el producto');
        }
    }
}

formItem.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('itemId').value;
    const categoriaId = document.getElementById('itemCategoriaId').value;
    const nombre = document.getElementById('itemNombre').value.trim();
    const descripcion = document.getElementById('itemDescripcion').value.trim();

    if (!id && !imagenActualItem) {
        alert('Por favor seleccione una imagen para el nuevo producto');
        return;
    }

    try {
        let imagen_url = previewImageItem.src;

        if (imagenActualItem) {
            if (id) {
                const { data: itemAnterior } = await supabase
                    .from('items')
                    .select('imagen_url')
                    .eq('id', id)
                    .single();
                    
                if (itemAnterior && itemAnterior.imagen_url) {
                    eliminarImagen(itemAnterior.imagen_url);
                }
            }
            imagen_url = await subirImagen(imagenActualItem, 'items');
        }

        const datosItem = {
            categoria_id: categoriaId,
            nombre: nombre,
            descripcion: descripcion,
            imagen_url: imagen_url
        };

        if (id) {
            await actualizarItem(id, datosItem);
        } else {
            await agregarItem(datosItem);
        }

        await cargarItems(categoriaId);
        cerrarModalItem();
    } catch (error) {
        alert('Error al guardar el producto: ' + error.message);
    }
});

// ========================================
// CERRAR MODALES CON ESC
// ========================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (!modalCategoria.classList.contains('hidden')) {
            cerrarModalCategoria();
        }
        if (!modalItem.classList.contains('hidden')) {
            cerrarModalItem();
        }
        if (!loginModal.classList.contains('hidden')) {
            loginModal.classList.add('hidden');
            passwordInput.value = '';
            errorMsg.textContent = '';
        }
    }
});