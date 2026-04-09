---
name: vehicle-identification-standards
description: Rules for when AnalyzeBot must flag is_vehicle=true to trigger CarBot, and critically, when NOT to flag. The outdoor equipment exclusion is the most important rule in vehicle classification.
when_to_use: Every AnalyzeBot scan.
version: 1.0.0
---

# Vehicle Identification Standards

## Primary Rule: The Road Test

The single most reliable classification test is this: does this item drive on public roads?

- Yes, it drives on roads: set is_vehicle=true.
- No, it mows grass, blows leaves, cuts wood, or pumps water: set is_vehicle=false and assign the correct outdoor equipment category.

This test resolves the vast majority of classification disputes before they require deeper analysis.

## The Outdoor Equipment Exclusion (Most Important Rule)

The following items are NEVER vehicles, regardless of whether they have engines, wheels, seats, or even steering wheels. They belong in the "Outdoor Power Equipment" category.

Riding mowers and garden tractors: John Deere, Husqvarna, Cub Cadet, Troy-Bilt, Craftsman, Toro, Ariens, Gravely, Snapper, Simplicity, Bad Boy, Ferris, Scag, Exmark. These items sit on four wheels, have a seat, and in some cases have a steering wheel. They are not vehicles.

Walk-behind power equipment: self-propelled lawn mowers, reel mowers (electric or gas), walk-behind snowblowers.

Handheld power tools: chainsaws, hedge trimmers, weed trimmers, pole saws, brush cutters, leaf blowers, handheld blowers, backpack blowers.

Stationary and semi-portable equipment: pressure washers, generators (portable or standby), rototillers, cultivators, log splitters, wood chippers, stump grinders, aerators, dethatchers.

Specialty outdoor equipment: trenchers (homeowner scale), sod cutters, post hole diggers (auger attachment type).

## What IS a Vehicle

The Vehicles category is exclusively for road-legal or road-capable motor vehicles and watercraft:

Road vehicles: passenger cars, pickup trucks, SUVs, crossovers, vans, minivans, cargo vans, station wagons.

Motorcycles and similar: motorcycles (street, touring, dirt), mopeds, scooters, sidecars.

Off-highway vehicles (but still recreational): ATVs (four-wheelers), UTVs (side-by-sides), dirt bikes intended primarily for off-road recreation, go-karts.

Trailers and towed units: boat trailers, utility trailers, car haulers, fifth-wheel trailers, travel trailers.

Recreational vehicles: motorhomes (Class A, B, C), camper vans, pop-up campers.

Watercraft: powerboats, sailboats, personal watercraft (Jet Ski, WaveRunner, Sea-Doo), pontoon boats, fishing boats, canoes, kayaks when sold with a motor or trailer.

## Gray Zone Items and How to Resolve Them

Golf carts: is_vehicle=true. They operate on paved paths and roads in many jurisdictions, carry passengers, and have VIN equivalents. CarBot can handle them.

Riding mowers with a cab or ROPS: still is_vehicle=false. A rollover protection structure does not make a mower a vehicle.

Zero-turn mowers: is_vehicle=false. No steering wheel, rear-wheel steering, intended exclusively for turf maintenance.

Farm tractors (large, 40+ HP): is_vehicle=false for most estate sale contexts. These are agricultural equipment. However, if the item is being sold as a road-legal vehicle (has plates, title, registered) and can operate on public roads, consult the description.

Mini bikes and pocket bikes: is_vehicle=true. These are intended as scaled-down motorcycles.

Electric bicycles (e-bikes): is_vehicle=true if they exceed 750W or are Class 3 (28 mph). Below that threshold, use "Bicycles" subcategory.

## Vehicle Identification from Photos

When is_vehicle=true is confirmed, extract as much identifying information as possible from the photos.

Make identification: look for badge or emblem on grille, hood, trunk, or wheels. Grille shape is highly brand-specific (BMW kidney, Mercedes star, Ford oval, Jeep seven-slot). Headlight shape and taillight design narrow the model family.

Model identification: body style (coupe, sedan, convertible, pickup) combined with overall proportions and character lines. Count doors. Note bed length on trucks.

Year estimation: headlight technology (sealed beam = pre-1984, composite = 1984+, projector = varies, LED = post-2005 typically). Bumper style (chrome = pre-1974, integrated = post-1973). Dashboard visible through windshield can place era.

Color: note the color but recognize that photos can shift color under different lighting. Use qualified language: "appears to be a medium blue, possibly Midnight Blue Metallic."

Condition visible in photos: rust, dents, broken glass, faded paint, cracked trim, flat tires, missing parts.

## License Plate Detection Protocol

If a license plate is visible in any photo, note this in the analysis output using the flag: plate_visible=true.

Do NOT record the plate number.
Do NOT attempt to read or interpret the state, jurisdiction, or expiration date.
Do NOT use the plate to identify the vehicle's registered owner.

The platform's PhotoBot pipeline will apply automatic blur to detected license plates before the item is published to any public storefront. Your role is only to flag the presence of the plate so the blur pipeline is triggered.

If the plate is already obscured, cropped, or unreadable, flag plate_visible=false.

## The Cost of Misclassification

Calling a riding mower a vehicle triggers two expensive downstream actions:

1. CarBot fires and performs a full vehicle history and market analysis, consuming credits the seller did not expect to spend.
2. The plate blur pipeline runs unnecessarily, adding processing time.

Calling a vehicle outdoor equipment prevents:

1. CarBot from running the VIN-equivalent analysis and Hagerty/NADA market lookup.
2. The seller from receiving accurate comps.
3. The platform from detecting salvage, flood, or lemon history flags.

The misclassification error rate for this specific confusion (riding mower vs. vehicle) is the highest single-category error in the AnalyzeBot system. It accounts for more wasted credits than any other misclassification. Treat this distinction as a hard rule, not a judgment call.

## Summary Decision Tree

Step 1: Does it have an engine or motor? If no, it is not a vehicle. Assign appropriate category.

Step 2: Does it move on its own power? If no, it is not a vehicle (stationary generator, etc.).

Step 3: Is it designed to transport passengers or cargo on roads or waterways? If yes, is_vehicle=true.

Step 4: Is it designed primarily to perform outdoor tasks (cutting, blowing, tilling, pumping, generating electricity)? If yes, is_vehicle=false. Assign outdoor power equipment category.

Step 5: Does it fall into a gray zone listed above? Apply the specific ruling for that item type.

When in doubt, ask: what would a person use this for on a typical Tuesday? If the answer is "mowing the lawn," it is outdoor equipment. If the answer is "driving to work," it is a vehicle.
