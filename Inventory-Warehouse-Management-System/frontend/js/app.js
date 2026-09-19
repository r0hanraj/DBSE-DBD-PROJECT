const API = "http://localhost:5000/api";
let currentPage = "dashboard";
let cache = { categories: [], suppliers: [], warehouses: [], products: [], inventory: [], purchases: [], sales: [] };

const content = document.getElementById("content");
const title = document.getElementById("pageTitle");
const subtitle = document.getElementById("pageSubtitle");

const pageInfo = {
  dashboard:["Dashboard","Warehouse overview and live statistics"],
  products:["Products","Create and manage your products"],
  categories:["Categories","Organize products by category"],
  suppliers:["Suppliers","Manage product suppliers"],
  warehouses:["Warehouses","Manage warehouse locations"],
  inventory:["Inventory","Track stock across warehouses"],
  purchases:["Purchases","Record incoming stock and automatically increase inventory"],
  sales:["Sales","Record outgoing stock and automatically reduce inventory"]
};

function esc(v){return String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function toast(msg, bad=false){const t=document.getElementById("toast");t.textContent=(bad?"⚠️ ":"✅ ")+msg;t.style.background=bad?"#b42318":"#16803c";t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3000)}
async function request(path, options={}) {
  const r = await fetch(API+path,{headers:{"Content-Type":"application/json"},...options});
  const data = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.message || "Request failed");
  return data;
}
async function load(key,path="/"+key){cache[key]=await request(path);return cache[key]}
function setPage(page){currentPage=page;document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===page));title.textContent=pageInfo[page][0];subtitle.textContent=pageInfo[page][1];render()}
document.getElementById("nav").onclick=e=>{const b=e.target.closest("button");if(b)setPage(b.dataset.page)}
document.getElementById("refreshBtn").onclick=()=>render();

async function checkAPI(){
  try{await fetch("http://localhost:5000");document.getElementById("apiStatus").textContent="● System Online";document.getElementById("apiStatus").style.color="#7ee787"}
  catch{document.getElementById("apiStatus").textContent="● Backend Offline";document.getElementById("apiStatus").style.color="#ff8b8b"}
}

function options(items,id,name,selected=""){return `<option value="">Select...</option>`+items.map(x=>`<option value="${x[id]}" ${String(x[id])===String(selected)?"selected":""}>${esc(x[name])}</option>`).join("")}
function table(headers,rows){return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}" class="empty">No records found</td></tr>`}</tbody></table></div>`}
function actionButtons(type,id){return `<div class="actions"><button class="edit" data-action="edit" data-type="${type}" data-id="${id}">✏️ Edit</button><button class="delete" data-action="delete" data-type="${type}" data-id="${id}">🗑️ Delete</button></div>`}

async function render(){
  try{
    if(currentPage==="dashboard") return dashboard();
    if(currentPage==="products") return products();
    if(currentPage==="categories") return categories();
    if(currentPage==="suppliers") return suppliers();
    if(currentPage==="warehouses") return warehouses();
    if(currentPage==="inventory") return inventory();
    if(currentPage==="purchases") return purchases();
    if(currentPage==="sales") return sales();
  }catch(e){content.innerHTML=`<div class="card"><h2>Connection Error</h2><p>${esc(e.message)}</p><p>Make sure backend is running at <b>http://localhost:5000</b>.</p></div>`}
}

async function dashboard(){
  const d=await request("/dashboard");
  content.innerHTML=`
  <div class="stats">
    <div class="stat"><span>📦 Total Products</span><strong>${d.total_products}</strong></div>
    <div class="stat"><span>📊 Total Stock</span><strong>${d.total_stock}</strong></div>
    <div class="stat"><span>⚠️ Low Stock Items</span><strong>${d.low_stock_items}</strong></div>
    <div class="stat"><span>🗂️ Categories</span><strong>${d.total_categories}</strong></div>
    <div class="stat"><span>🚚 Suppliers</span><strong>${d.total_suppliers}</strong></div>
    <div class="stat"><span>🏭 Warehouses</span><strong>${d.total_warehouses}</strong></div>
  </div>
  <div class="card"><h2>⚠️ Low Stock Products</h2>${table(["ID","Product","Current Stock","Reorder Level"],d.low_stock_products.map(x=>`<tr><td>${x.product_id}</td><td>${esc(x.product_name)}</td><td><span class="badge low">${x.total_stock}</span></td><td>${x.reorder_level}</td></tr>`).join(""))}</div>`;
}

async function categories(){
  await load("categories");
  content.innerHTML=`<div class="grid"><div class="card"><h2 id="formTitle">➕ Add Category</h2>
  <form id="entityForm" data-type="categories"><input type="hidden" name="id">
  <div class="form-grid"><label>Category Name<input name="category_name" required></label><label>Description<input name="description"></label></div>
  <div class="form-actions"><button class="primary">Save Category</button><button type="button" class="secondary" onclick="render()">Cancel</button></div></form></div>
  <div class="card"><h2>Category List</h2>${table(["ID","Name","Description","Actions"],cache.categories.map(x=>`<tr><td>${x.category_id}</td><td>${esc(x.category_name)}</td><td>${esc(x.description)}</td><td>${actionButtons("categories",x.category_id)}</td></tr>`).join(""))}</div></div>`;
  bindEntityForm();
}

async function suppliers(){
  await load("suppliers");
  content.innerHTML=`<div class="grid"><div class="card"><h2 id="formTitle">➕ Add Supplier</h2><form id="entityForm" data-type="suppliers"><input type="hidden" name="id">
  <div class="form-grid"><label>Name<input name="supplier_name" required></label><label>Email<input type="email" name="email"></label><label>Phone<input name="phone"></label><label>Address<input name="address"></label></div>
  <div class="form-actions"><button class="primary">Save Supplier</button><button type="button" class="secondary" onclick="render()">Cancel</button></div></form></div>
  <div class="card"><h2>Supplier List</h2>${table(["Name","Email","Phone","Address","Actions"],cache.suppliers.map(x=>`<tr><td>${esc(x.supplier_name)}</td><td>${esc(x.email)}</td><td>${esc(x.phone)}</td><td>${esc(x.address)}</td><td>${actionButtons("suppliers",x.supplier_id)}</td></tr>`).join(""))}</div></div>`;
  bindEntityForm();
}

async function warehouses(){
  await load("warehouses");
  content.innerHTML=`<div class="grid"><div class="card"><h2 id="formTitle">➕ Add Warehouse</h2><form id="entityForm" data-type="warehouses"><input type="hidden" name="id">
  <div class="form-grid"><label>Warehouse Name<input name="warehouse_name" required></label><label>Location<input name="location"></label><label>Capacity<input type="number" min="0" name="capacity"></label></div>
  <div class="form-actions"><button class="primary">Save Warehouse</button><button type="button" class="secondary" onclick="render()">Cancel</button></div></form></div>
  <div class="card"><h2>Warehouse List</h2>${table(["ID","Name","Location","Capacity","Actions"],cache.warehouses.map(x=>`<tr><td>${x.warehouse_id}</td><td>${esc(x.warehouse_name)}</td><td>${esc(x.location)}</td><td>${x.capacity??"-"}</td><td>${actionButtons("warehouses",x.warehouse_id)}</td></tr>`).join(""))}</div></div>`;
  bindEntityForm();
}

async function products(){
  await Promise.all([load("products"),load("categories"),load("suppliers")]);
  content.innerHTML=`<div class="card"><h2 id="formTitle">➕ Add Product</h2><form id="entityForm" data-type="products"><input type="hidden" name="id">
  <div class="form-grid"><label>Product Name<input name="product_name" required></label><label>Category<select name="category_id">${options(cache.categories,"category_id","category_name")}</select></label>
  <label>Supplier<select name="supplier_id">${options(cache.suppliers,"supplier_id","supplier_name")}</select></label><label>Price<input type="number" step="0.01" min="0" name="price" value="0"></label>
  <label>Reorder Level<input type="number" min="0" name="reorder_level" value="0"></label><label>Description<input name="description"></label></div>
  <div class="form-actions"><button class="primary">Save Product</button><button type="button" class="secondary" onclick="render()">Cancel</button></div></form></div>
  <div class="card" style="margin-top:20px"><div class="toolbar"><h2>Product List</h2><input class="search" placeholder="Search products..." oninput="filterTable(this)"></div>
  ${table(["ID","Product","Category","Supplier","Price","Stock","Reorder","Actions"],cache.products.map(x=>`<tr><td>${x.product_id}</td><td>${esc(x.product_name)}</td><td>${esc(x.category_name||"-")}</td><td>${esc(x.supplier_name||"-")}</td><td>$${Number(x.price).toFixed(2)}</td><td>${x.total_stock}</td><td>${x.reorder_level}</td><td>${actionButtons("products",x.product_id)}</td></tr>`).join(""))}</div>`;
  bindEntityForm();
}

async function inventory(){
  await Promise.all([load("inventory"),load("products"),load("warehouses")]);
  content.innerHTML=`<div class="grid"><div class="card"><h2>➕ Add Inventory Record</h2><form id="inventoryForm">
  <div class="form-grid"><label>Product<select name="product_id" required>${options(cache.products,"product_id","product_name")}</select></label><label>Warehouse<select name="warehouse_id" required>${options(cache.warehouses,"warehouse_id","warehouse_name")}</select></label><label class="full">Initial Quantity<input type="number" min="0" name="quantity" value="0" required></label></div>
  <div class="form-actions"><button class="primary">Add Inventory</button></div></form></div>
  <div class="card"><h2>Inventory Records</h2>${table(["Product","Warehouse","Quantity","Status","Actions"],cache.inventory.map(x=>`<tr><td>${esc(x.product_name)}</td><td>${esc(x.warehouse_name)}</td><td>${x.quantity}</td><td>${x.is_low_stock?'<span class="badge low">Low Stock</span>':'<span class="badge ok">Healthy</span>'}</td><td><div class="actions"><button class="edit" data-action="stock" data-id="${x.inventory_id}" data-qty="${x.quantity}">🔢 Update</button><button class="delete" data-action="delete" data-type="inventory" data-id="${x.inventory_id}">🗑️ Delete</button></div></td></tr>`).join(""))}</div></div>`;
  document.getElementById("inventoryForm").onsubmit=async e=>{e.preventDefault();try{const d=Object.fromEntries(new FormData(e.target));await request("/inventory",{method:"POST",body:JSON.stringify(d)});toast("Inventory added");render()}catch(err){toast(err.message,true)}};
}

async function purchases(){
  await Promise.all([load("purchases"),load("products"),load("warehouses"),load("suppliers")]);
  content.innerHTML=`<div class="grid"><div class="card"><h2>📥 Record Purchase</h2><form id="movementForm" data-type="purchases"><div class="form-grid">
  <label>Product<select name="product_id" required>${options(cache.products,"product_id","product_name")}</select></label><label>Warehouse<select name="warehouse_id" required>${options(cache.warehouses,"warehouse_id","warehouse_name")}</select></label>
  <label>Supplier<select name="supplier_id">${options(cache.suppliers,"supplier_id","supplier_name")}</select></label><label>Quantity<input type="number" min="1" name="quantity" required></label><label>Unit Cost<input type="number" min="0" step="0.01" name="unit_cost" value="0"></label><label>Notes<input name="notes"></label></div><div class="form-actions"><button class="primary">Record Purchase</button></div></form></div>
  <div class="card"><h2>Purchase History</h2>${table(["Product","Warehouse","Supplier","Qty","Cost","Date","Actions"],cache.purchases.map(x=>`<tr><td>${esc(x.product_name)}</td><td>${esc(x.warehouse_name)}</td><td>${esc(x.supplier_name||"-")}</td><td>${x.quantity}</td><td>$${Number(x.unit_cost).toFixed(2)}</td><td>${new Date(x.purchased_at).toLocaleString()}</td><td><button class="delete" data-action="delete" data-type="purchases" data-id="${x.purchase_id}">🗑️ Delete</button></td></tr>`).join(""))}</div></div>`;
  bindMovement();
}

async function sales(){
  await Promise.all([load("sales"),load("products"),load("warehouses")]);
  content.innerHTML=`<div class="grid"><div class="card"><h2>🛒 Record Sale</h2><form id="movementForm" data-type="sales"><div class="form-grid">
  <label>Product<select name="product_id" required>${options(cache.products,"product_id","product_name")}</select></label><label>Warehouse<select name="warehouse_id" required>${options(cache.warehouses,"warehouse_id","warehouse_name")}</select></label>
  <label>Quantity<input type="number" min="1" name="quantity" required></label><label>Unit Price<input type="number" min="0" step="0.01" name="unit_price" value="0"></label><label>Customer Name<input name="customer_name"></label><label>Notes<input name="notes"></label></div><div class="form-actions"><button class="primary">Record Sale</button></div></form></div>
  <div class="card"><h2>Sales History</h2>${table(["Product","Warehouse","Qty","Price","Customer","Date","Actions"],cache.sales.map(x=>`<tr><td>${esc(x.product_name)}</td><td>${esc(x.warehouse_name)}</td><td>${x.quantity}</td><td>$${Number(x.unit_price).toFixed(2)}</td><td>${esc(x.customer_name)}</td><td>${new Date(x.sold_at).toLocaleString()}</td><td><button class="delete" data-action="delete" data-type="sales" data-id="${x.sale_id}">🗑️ Delete</button></td></tr>`).join(""))}</div></div>`;
  bindMovement();
}

function bindEntityForm(){
  const f=document.getElementById("entityForm");
  f.onsubmit=async e=>{e.preventDefault();try{const d=Object.fromEntries(new FormData(f));const id=d.id;delete d.id;await request("/"+f.dataset.type+(id?"/"+id:""),{method:id?"PUT":"POST",body:JSON.stringify(d)});toast(id?"Updated successfully":"Added successfully");render()}catch(err){toast(err.message,true)}};
}

function bindMovement(){
  const f=document.getElementById("movementForm");
  f.onsubmit=async e=>{e.preventDefault();try{const d=Object.fromEntries(new FormData(f));await request("/"+f.dataset.type,{method:"POST",body:JSON.stringify(d)});toast(f.dataset.type==="purchases"?"Purchase recorded and stock increased":"Sale recorded and stock reduced");render()}catch(err){toast(err.message,true)}};
}

content.onclick=async e=>{
  const b=e.target.closest("button[data-action]");if(!b)return;
  const action=b.dataset.action,type=b.dataset.type,id=b.dataset.id;
  if(action==="delete"){if(!confirm("Are you sure you want to delete this record?"))return;try{await request("/"+type+"/"+id,{method:"DELETE"});toast("Deleted successfully");render()}catch(err){toast(err.message,true)}}
  if(action==="stock"){const q=prompt("Enter new quantity:",b.dataset.qty);if(q===null)return;try{await request("/inventory/"+id,{method:"PUT",body:JSON.stringify({quantity:q})});toast("Stock updated");render()}catch(err){toast(err.message,true)}}
  if(action==="edit"){await editEntity(type,id)}
};

async function editEntity(type,id){
  await load(type);
  const map={categories:"category_id",suppliers:"supplier_id",warehouses:"warehouse_id",products:"product_id"};
  const item=cache[type].find(x=>String(x[map[type]])===String(id));if(!item)return;
  document.querySelector("#entityForm [name=id]").value=id;
  Object.entries(item).forEach(([k,v])=>{const el=document.querySelector(`#entityForm [name="${k}"]`);if(el)el.value=v??""});
  const ft=document.getElementById("formTitle");if(ft)ft.textContent="✏️ Edit "+type.slice(0,-1);
  document.getElementById("entityForm").scrollIntoView({behavior:"smooth",block:"center"});
}

function filterTable(input){const q=input.value.toLowerCase();input.closest(".card").querySelectorAll("tbody tr").forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?"":"none")}

checkAPI();render();
