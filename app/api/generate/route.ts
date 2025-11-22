import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const code = generateBlenderCode(prompt)

    return NextResponse.json({ code })
  } catch (error) {
    console.error('Error generating code:', error)
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    )
  }
}

function generateBlenderCode(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase()

  // Parse building characteristics from prompt
  const floors = extractNumber(lowerPrompt, ['floor', 'story', 'stories', 'level']) || 5
  const width = extractNumber(lowerPrompt, ['wide', 'width']) || 10
  const depth = extractNumber(lowerPrompt, ['deep', 'depth']) || 10
  const floorHeight = 3

  // Determine building style
  const isModern = /modern|contemporary|futuristic|glass/.test(lowerPrompt)
  const isGothic = /gothic|cathedral|church|spire/.test(lowerPrompt)
  const isCastle = /castle|fortress|medieval|tower/.test(lowerPrompt)
  const isCottage = /cottage|small|house|home/.test(lowerPrompt)
  const isWarehouse = /warehouse|industrial|factory|garage/.test(lowerPrompt)

  let buildingCode = ''

  if (isGothic) {
    buildingCode = generateGothicBuilding(floors, width, depth, floorHeight)
  } else if (isCastle) {
    buildingCode = generateCastle(width, depth, floorHeight)
  } else if (isCottage) {
    buildingCode = generateCottage(width, depth, floorHeight)
  } else if (isWarehouse) {
    buildingCode = generateWarehouse(width, depth, floorHeight)
  } else if (isModern) {
    buildingCode = generateModernBuilding(floors, width, depth, floorHeight)
  } else {
    buildingCode = generateStandardBuilding(floors, width, depth, floorHeight)
  }

  return buildingCode
}

function extractNumber(text: string, keywords: string[]): number | null {
  for (const keyword of keywords) {
    const regex = new RegExp(`(\\d+)\\s*${keyword}|${keyword}\\s*(\\d+)`, 'i')
    const match = text.match(regex)
    if (match) {
      return parseInt(match[1] || match[2])
    }
  }
  return null
}

function generateStandardBuilding(floors: number, width: number, depth: number, floorHeight: number): string {
  return `import bpy
import bmesh
from mathutils import Vector

# Clear existing mesh objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False, confirm=False)
bpy.ops.outliner.orphans_purge()

# Building parameters
floors = ${floors}
floor_height = ${floorHeight}
width = ${width}
depth = ${depth}
total_height = floors * floor_height

# Create main building structure
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, total_height/2))
building = bpy.context.active_object
building.name = "Building_Main"
building.scale = (width/2, depth/2, total_height/2)

# Create windows for each floor
window_width = 1.5
window_height = 1.8
window_spacing = 2.5

for floor in range(floors):
    floor_z = floor * floor_height + floor_height/2

    # Front and back windows
    for x_pos in range(-int(width/2) + 2, int(width/2) - 1, int(window_spacing)):
        # Front windows
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, depth/2 + 0.1, floor_z))
        window = bpy.context.active_object
        window.scale = (window_width/2, 0.2, window_height/2)
        window.name = f"Window_Front_F{floor}"

        # Back windows
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, -depth/2 - 0.1, floor_z))
        window = bpy.context.active_object
        window.scale = (window_width/2, 0.2, window_height/2)
        window.name = f"Window_Back_F{floor}"

    # Side windows
    for y_pos in range(-int(depth/2) + 2, int(depth/2) - 1, int(window_spacing)):
        # Left windows
        bpy.ops.mesh.primitive_cube_add(size=1, location=(-width/2 - 0.1, y_pos, floor_z))
        window = bpy.context.active_object
        window.scale = (0.2, window_width/2, window_height/2)
        window.name = f"Window_Left_F{floor}"

        # Right windows
        bpy.ops.mesh.primitive_cube_add(size=1, location=(width/2 + 0.1, y_pos, floor_z))
        window = bpy.context.active_object
        window.scale = (0.2, window_width/2, window_height/2)
        window.name = f"Window_Right_F{floor}"

# Create entrance
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, depth/2 + 0.2, 1.5))
entrance = bpy.context.active_object
entrance.scale = (2, 0.3, 1.5)
entrance.name = "Entrance"

# Create roof
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, total_height + 0.3))
roof = bpy.context.active_object
roof.scale = (width/2 + 0.5, depth/2 + 0.5, 0.3)
roof.name = "Roof"

# Add materials
def create_material(name, color):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs['Base Color'].default_value = color
    return mat

# Assign materials
building_mat = create_material("Building_Material", (0.8, 0.8, 0.7, 1.0))
building.data.materials.append(building_mat)

window_mat = create_material("Window_Material", (0.5, 0.7, 0.9, 1.0))
for obj in bpy.data.objects:
    if "Window" in obj.name:
        obj.data.materials.append(window_mat)

entrance_mat = create_material("Entrance_Material", (0.3, 0.2, 0.1, 1.0))
entrance.data.materials.append(entrance_mat)

roof_mat = create_material("Roof_Material", (0.4, 0.3, 0.3, 1.0))
roof.data.materials.append(roof_mat)

# Add lighting
bpy.ops.object.light_add(type='SUN', location=(10, 10, 20))
sun = bpy.context.active_object
sun.data.energy = 2

# Set camera
bpy.ops.object.camera_add(location=(width * 1.5, -depth * 1.5, total_height * 0.7))
camera = bpy.context.active_object
camera.rotation_euler = (1.1, 0, 0.785)
bpy.context.scene.camera = camera

print(f"Building generated: {floors} floors, {width}x{depth}m, {total_height}m tall")
`
}

function generateModernBuilding(floors: number, width: number, depth: number, floorHeight: number): string {
  return `import bpy
import math

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False, confirm=False)
bpy.ops.outliner.orphans_purge()

# Parameters
floors = ${floors}
floor_height = ${floorHeight}
width = ${width}
depth = ${depth}
total_height = floors * floor_height

# Main structure with twist
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, total_height/2))
building = bpy.context.active_object
building.name = "Modern_Building"
building.scale = (width/2, depth/2, total_height/2)

# Add twist modifier for futuristic look
bpy.ops.object.modifier_add(type='SIMPLE_DEFORM')
building.modifiers["SimpleDeform"].deform_method = 'TWIST'
building.modifiers["SimpleDeform"].angle = 0.3

# Glass facade
for floor in range(floors):
    z = floor * floor_height + floor_height/2

    # Create glass panels
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, depth/2 + 0.2, z))
    panel = bpy.context.active_object
    panel.scale = (width/2 - 0.5, 0.1, floor_height/2 - 0.2)
    panel.name = f"Glass_Front_{floor}"

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -depth/2 - 0.2, z))
    panel = bpy.context.active_object
    panel.scale = (width/2 - 0.5, 0.1, floor_height/2 - 0.2)
    panel.name = f"Glass_Back_{floor}"

# Balconies
for floor in range(1, floors):
    z = floor * floor_height
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, depth/2 + 1, z))
    balcony = bpy.context.active_object
    balcony.scale = (width/2 - 1, 0.8, 0.1)
    balcony.name = f"Balcony_{floor}"

# Materials
building_mat = bpy.data.materials.new(name="Modern_Concrete")
building_mat.use_nodes = True
building_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.9, 0.9, 0.9, 1.0)
building_mat.node_tree.nodes["Principled BSDF"].inputs['Roughness'].default_value = 0.3
building.data.materials.append(building_mat)

glass_mat = bpy.data.materials.new(name="Modern_Glass")
glass_mat.use_nodes = True
glass_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.6, 0.8, 1.0, 1.0)
glass_mat.node_tree.nodes["Principled BSDF"].inputs['Transmission'].default_value = 0.95
glass_mat.node_tree.nodes["Principled BSDF"].inputs['Roughness'].default_value = 0.1

for obj in bpy.data.objects:
    if "Glass" in obj.name:
        obj.data.materials.append(glass_mat)

# Lighting
bpy.ops.object.light_add(type='SUN', location=(15, -15, 25))
sun = bpy.context.active_object
sun.data.energy = 3

bpy.ops.object.camera_add(location=(width * 2, -depth * 2, total_height * 0.6))
camera = bpy.context.active_object
camera.rotation_euler = (1.2, 0, 0.785)
bpy.context.scene.camera = camera

print(f"Modern building created: {floors} floors, {total_height}m tall")
`
}

function generateGothicBuilding(floors: number, width: number, depth: number, floorHeight: number): string {
  return `import bpy
import math

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False, confirm=False)
bpy.ops.outliner.orphans_purge()

# Parameters
width = ${width}
depth = ${depth * 2}
height = ${floors * floorHeight}

# Main cathedral body
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, height/2))
main_body = bpy.context.active_object
main_body.scale = (width/2, depth/2, height/2)
main_body.name = "Cathedral_Body"

# Create tall spires
spire_height = height * 0.6
for x_pos in [-width/2 + 2, width/2 - 2]:
    # Spire base
    bpy.ops.mesh.primitive_cylinder_add(radius=1.5, depth=spire_height, location=(x_pos, depth/3, height + spire_height/2))
    spire = bpy.context.active_object
    spire.name = f"Spire_{x_pos}"

    # Spire top (cone)
    bpy.ops.mesh.primitive_cone_add(radius1=1.5, radius2=0, depth=spire_height/3,
                                     location=(x_pos, depth/3, height + spire_height + spire_height/6))
    cone = bpy.context.active_object
    cone.name = f"Spire_Top_{x_pos}"

# Gothic arch windows
arch_height = 6
arch_width = 2
for z in range(int(height/8), int(height), int(height/4)):
    for x_pos in range(-int(width/2) + 3, int(width/2) - 2, 4):
        # Create pointed arch window
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, depth/2 + 0.1, z))
        window = bpy.context.active_object
        window.scale = (arch_width/2, 0.2, arch_height/2)
        window.name = f"Gothic_Window_{z}_{x_pos}"

# Rose window (circular)
bpy.ops.mesh.primitive_cylinder_add(radius=3, depth=0.3, location=(0, -depth/2 - 0.2, height * 0.7))
rose_window = bpy.context.active_object
rose_window.rotation_euler = (math.pi/2, 0, 0)
rose_window.name = "Rose_Window"

# Flying buttresses
for z in range(int(height/4), int(height), int(height/3)):
    for side in [-1, 1]:
        x_pos = side * (width/2 + 2)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, 0, z))
        buttress = bpy.context.active_object
        buttress.scale = (0.5, depth/3, 1)
        buttress.rotation_euler = (0, 0, side * 0.3)
        buttress.name = f"Buttress_{z}_{side}"

# Materials
stone_mat = bpy.data.materials.new(name="Gothic_Stone")
stone_mat.use_nodes = True
stone_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.6, 0.55, 0.5, 1.0)
stone_mat.node_tree.nodes["Principled BSDF"].inputs['Roughness'].default_value = 0.9

main_body.data.materials.append(stone_mat)
for obj in bpy.data.objects:
    if "Spire" in obj.name or "Buttress" in obj.name:
        obj.data.materials.append(stone_mat)

stained_glass_mat = bpy.data.materials.new(name="Stained_Glass")
stained_glass_mat.use_nodes = True
stained_glass_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.8, 0.3, 0.4, 1.0)
stained_glass_mat.node_tree.nodes["Principled BSDF"].inputs['Transmission'].default_value = 0.9

for obj in bpy.data.objects:
    if "Window" in obj.name:
        obj.data.materials.append(stained_glass_mat)

# Lighting
bpy.ops.object.light_add(type='SUN', location=(20, -20, 30))
sun = bpy.context.active_object
sun.data.energy = 2.5

bpy.ops.object.camera_add(location=(width * 1.8, -depth * 1.2, height * 0.8))
camera = bpy.context.active_object
camera.rotation_euler = (1.15, 0, 0.6)
bpy.context.scene.camera = camera

print("Gothic cathedral generated")
`
}

function generateCastle(width: number, depth: number, floorHeight: number): string {
  return `import bpy
import math

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False, confirm=False)
bpy.ops.outliner.orphans_purge()

# Parameters
width = ${width}
depth = ${depth}
wall_height = ${floorHeight * 3}
tower_height = ${floorHeight * 5}

# Main castle walls
wall_thickness = 1
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, wall_height/2))
walls = bpy.context.active_object
walls.scale = (width/2, depth/2, wall_height/2)
walls.name = "Castle_Walls"

# Create hollow interior
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, wall_height/2))
interior = bpy.context.active_object
interior.scale = (width/2 - wall_thickness, depth/2 - wall_thickness, wall_height/2 + 1)

# Boolean to make walls hollow
bool_mod = walls.modifiers.new(name="Boolean", type='BOOLEAN')
bool_mod.operation = 'DIFFERENCE'
bool_mod.object = interior
bpy.context.view_layer.objects.active = walls
bpy.ops.object.modifier_apply(modifier="Boolean")
bpy.data.objects.remove(interior, do_unlink=True)

# Corner towers
tower_positions = [
    (-width/2, -depth/2),
    (width/2, -depth/2),
    (-width/2, depth/2),
    (width/2, depth/2)
]

for i, (x, y) in enumerate(tower_positions):
    bpy.ops.mesh.primitive_cylinder_add(radius=2, depth=tower_height, location=(x, y, tower_height/2))
    tower = bpy.context.active_object
    tower.name = f"Tower_{i}"

    # Battlements on tower
    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        bx = x + 2.2 * math.cos(rad)
        by = y + 2.2 * math.sin(rad)
        bpy.ops.mesh.primitive_cube_add(size=0.5, location=(bx, by, tower_height + 0.3))
        battlement = bpy.context.active_object
        battlement.scale = (0.4, 0.4, 0.6)
        battlement.name = f"Tower_Battlement_{i}_{angle}"

# Wall battlements
battlement_spacing = 2
for x in range(-int(width/2) + 2, int(width/2) - 1, battlement_spacing):
    for y_pos in [-depth/2, depth/2]:
        bpy.ops.mesh.primitive_cube_add(size=0.8, location=(x, y_pos, wall_height + 0.4))
        batt = bpy.context.active_object
        batt.scale = (0.6, wall_thickness/2, 0.8)
        batt.name = f"Wall_Battlement_X_{x}"

for y in range(-int(depth/2) + 2, int(depth/2) - 1, battlement_spacing):
    for x_pos in [-width/2, width/2]:
        bpy.ops.mesh.primitive_cube_add(size=0.8, location=(x_pos, y, wall_height + 0.4))
        batt = bpy.context.active_object
        batt.scale = (wall_thickness/2, 0.6, 0.8)
        batt.name = f"Wall_Battlement_Y_{y}"

# Gate
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -depth/2, wall_height/3))
gate = bpy.context.active_object
gate.scale = (2.5, wall_thickness + 0.2, wall_height/3)
gate.name = "Castle_Gate"

# Materials
stone_mat = bpy.data.materials.new(name="Castle_Stone")
stone_mat.use_nodes = True
stone_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.5, 0.5, 0.45, 1.0)
stone_mat.node_tree.nodes["Principled BSDF"].inputs['Roughness'].default_value = 0.95

walls.data.materials.append(stone_mat)
for obj in bpy.data.objects:
    if "Tower" in obj.name or "Battlement" in obj.name:
        obj.data.materials.append(stone_mat)

gate_mat = bpy.data.materials.new(name="Wood_Gate")
gate_mat.use_nodes = True
gate_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.3, 0.2, 0.1, 1.0)
gate.data.materials.append(gate_mat)

# Lighting
bpy.ops.object.light_add(type='SUN', location=(25, -25, 35))
sun = bpy.context.active_object
sun.data.energy = 2.5

bpy.ops.object.camera_add(location=(width * 1.5, -depth * 1.8, tower_height * 0.7))
camera = bpy.context.active_object
camera.rotation_euler = (1.2, 0, 0.5)
bpy.context.scene.camera = camera

print("Castle generated with towers and battlements")
`
}

function generateCottage(width: number, depth: number, floorHeight: number): string {
  return `import bpy
import math

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False, confirm=False)
bpy.ops.outliner.orphans_purge()

# Parameters
width = ${width * 0.6}
depth = ${depth * 0.6}
height = ${floorHeight * 1.5}

# Main cottage body
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, height/2))
cottage = bpy.context.active_object
cottage.scale = (width/2, depth/2, height/2)
cottage.name = "Cottage_Main"

# Sloped roof
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, height + 1))
roof = bpy.context.active_object
roof.scale = (width/2 + 0.5, depth/2 + 0.5, 1)
roof.rotation_euler = (0, math.radians(30), 0)
roof.name = "Cottage_Roof"

# Second roof piece
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, height + 1))
roof2 = bpy.context.active_object
roof2.scale = (width/2 + 0.5, depth/2 + 0.5, 1)
roof2.rotation_euler = (0, math.radians(-30), 0)
roof2.name = "Cottage_Roof2"

# Chimney
bpy.ops.mesh.primitive_cube_add(size=1, location=(width/3, 0, height + 2.5))
chimney = bpy.context.active_object
chimney.scale = (0.6, 0.6, 2)
chimney.name = "Chimney"

# Windows
window_positions = [
    (-width/3, depth/2 + 0.1, height/2),
    (width/3, depth/2 + 0.1, height/2),
    (-width/3, -depth/2 - 0.1, height/2),
]

for i, (x, y, z) in enumerate(window_positions):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    window = bpy.context.active_object
    window.scale = (0.7, 0.15, 0.9)
    window.name = f"Window_{i}"

# Door
bpy.ops.mesh.primitive_cube_add(size=1, location=(width/3, -depth/2 - 0.1, height/3))
door = bpy.context.active_object
door.scale = (0.8, 0.15, height/3)
door.name = "Door"

# Small porch
bpy.ops.mesh.primitive_cube_add(size=1, location=(width/3, -depth/2 - 1, 0.1))
porch = bpy.context.active_object
porch.scale = (1.2, 0.8, 0.1)
porch.name = "Porch"

# Materials
cottage_mat = bpy.data.materials.new(name="Cottage_Walls")
cottage_mat.use_nodes = True
cottage_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.9, 0.85, 0.7, 1.0)
cottage.data.materials.append(cottage_mat)

roof_mat = bpy.data.materials.new(name="Cottage_Roof")
roof_mat.use_nodes = True
roof_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.6, 0.3, 0.2, 1.0)
roof.data.materials.append(roof_mat)
roof2.data.materials.append(roof_mat)

chimney_mat = bpy.data.materials.new(name="Brick")
chimney_mat.use_nodes = True
chimney_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.7, 0.3, 0.2, 1.0)
chimney.data.materials.append(chimney_mat)

window_mat = bpy.data.materials.new(name="Window_Glass")
window_mat.use_nodes = True
window_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.7, 0.8, 0.9, 1.0)
for obj in bpy.data.objects:
    if "Window" in obj.name:
        obj.data.materials.append(window_mat)

door_mat = bpy.data.materials.new(name="Wood_Door")
door_mat.use_nodes = True
door_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.4, 0.25, 0.15, 1.0)
door.data.materials.append(door_mat)

# Lighting
bpy.ops.object.light_add(type='SUN', location=(10, -10, 15))
sun = bpy.context.active_object
sun.data.energy = 2

bpy.ops.object.camera_add(location=(width * 2, -depth * 2.5, height * 1.5))
camera = bpy.context.active_object
camera.rotation_euler = (1.1, 0, 0.6)
bpy.context.scene.camera = camera

print("Cozy cottage generated")
`
}

function generateWarehouse(width: number, depth: number, floorHeight: number): string {
  return `import bpy

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False, confirm=False)
bpy.ops.outliner.orphans_purge()

# Parameters
width = ${width * 1.5}
depth = ${depth * 2}
height = ${floorHeight * 2}

# Main warehouse body
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, height/2))
warehouse = bpy.context.active_object
warehouse.scale = (width/2, depth/2, height/2)
warehouse.name = "Warehouse_Main"

# Sloped roof sections
bpy.ops.mesh.primitive_cube_add(size=2, location=(-width/4, 0, height + 0.8))
roof1 = bpy.context.active_object
roof1.scale = (width/4, depth/2 + 0.3, 0.2)
roof1.rotation_euler = (0, 0.3, 0)
roof1.name = "Roof_Section1"

bpy.ops.mesh.primitive_cube_add(size=2, location=(width/4, 0, height + 0.8))
roof2 = bpy.context.active_object
roof2.scale = (width/4, depth/2 + 0.3, 0.2)
roof2.rotation_euler = (0, -0.3, 0)
roof2.name = "Roof_Section2"

# Large garage doors (loading docks)
door_width = width/3
door_height = height * 0.7

for x_offset in [-width/3, 0, width/3]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_offset, -depth/2 - 0.1, door_height/2))
    door = bpy.context.active_object
    door.scale = (door_width/2 - 0.2, 0.15, door_height/2)
    door.name = f"Garage_Door_{x_offset}"

    # Door frame
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_offset, -depth/2 - 0.2, door_height/2))
    frame = bpy.context.active_object
    frame.scale = (door_width/2, 0.2, door_height/2 + 0.2)
    frame.name = f"Door_Frame_{x_offset}"

# Loading dock platforms
for x_offset in [-width/3, 0, width/3]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_offset, -depth/2 - 2, 0.6))
    platform = bpy.context.active_object
    platform.scale = (door_width/2, 1, 0.6)
    platform.name = f"Loading_Platform_{x_offset}"

# Small windows near roof
for x in range(-int(width/2) + 2, int(width/2) - 1, 4):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, depth/2 + 0.1, height - 1.5))
    window = bpy.context.active_object
    window.scale = (1, 0.15, 0.8)
    window.name = f"High_Window_{x}"

# Ventilation units on roof
for x_pos in [-width/4, width/4]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x_pos, 0, height + 1.5))
    vent = bpy.context.active_object
    vent.scale = (1, 1, 0.5)
    vent.name = f"Vent_Unit_{x_pos}"

# Materials
metal_mat = bpy.data.materials.new(name="Metal_Siding")
metal_mat.use_nodes = True
metal_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.7, 0.7, 0.7, 1.0)
metal_mat.node_tree.nodes["Principled BSDF"].inputs['Metallic'].default_value = 0.8
metal_mat.node_tree.nodes["Principled BSDF"].inputs['Roughness'].default_value = 0.4
warehouse.data.materials.append(metal_mat)

roof_mat = bpy.data.materials.new(name="Metal_Roof")
roof_mat.use_nodes = True
roof_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.5, 0.5, 0.5, 1.0)
roof_mat.node_tree.nodes["Principled BSDF"].inputs['Metallic'].default_value = 0.9
roof1.data.materials.append(roof_mat)
roof2.data.materials.append(roof_mat)

door_mat = bpy.data.materials.new(name="Garage_Door")
door_mat.use_nodes = True
door_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.9, 0.6, 0.2, 1.0)
for obj in bpy.data.objects:
    if "Garage_Door" in obj.name:
        obj.data.materials.append(door_mat)

concrete_mat = bpy.data.materials.new(name="Concrete")
concrete_mat.use_nodes = True
concrete_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (0.6, 0.6, 0.6, 1.0)
for obj in bpy.data.objects:
    if "Platform" in obj.name or "Frame" in obj.name:
        obj.data.materials.append(concrete_mat)

# Lighting
bpy.ops.object.light_add(type='SUN', location=(15, -20, 25))
sun = bpy.context.active_object
sun.data.energy = 2.5

bpy.ops.object.camera_add(location=(width * 1.2, -depth * 1.5, height * 1.2))
camera = bpy.context.active_object
camera.rotation_euler = (1.1, 0, 0.5)
bpy.context.scene.camera = camera

print("Industrial warehouse generated with loading docks")
`
}
