import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";
import { BookingStatus, PaymentStatus, Role, Weekday } from "./generated/prisma/enums";

const DEMO_PASSWORD = "Password@123";
const ADMIN_PASSWORD = "Admin@123";

function daysFromNow(days: number, hour = 10) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return date;
}

async function main() {
    // Child rows first so foreign keys never block the wipe.
    await prisma.review.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.availabilitySlot.deleteMany();
    await prisma.service.deleteMany();
    await prisma.technicianProfile.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    console.log("🗑️  Cleared existing data.");

    const password = await bcrypt.hash(DEMO_PASSWORD, 10);
    const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // ── Categories ─────────────────────────────────────────────────────
    const plumbing = await prisma.category.create({
        data: { name: "Plumbing", description: "Leaks, pipes, fittings and drainage" },
    });
    const electrical = await prisma.category.create({
        data: { name: "Electrical", description: "Wiring, sockets, lighting and panels" },
    });
    const cleaning = await prisma.category.create({
        data: { name: "Cleaning", description: "Deep cleaning for homes and offices" },
    });
    await prisma.category.create({
        data: { name: "Painting", description: "Interior and exterior painting" },
    });
    const appliance = await prisma.category.create({
        data: {
            name: "Appliance Repair",
            description: "AC, fridge and washing machine repair",
        },
    });

    console.log("📂 Created 5 service categories.");

    // ── Admin ──────────────────────────────────────────────────────────
    const admin = await prisma.user.create({
        data: {
            name: "Platform Admin",
            email: "admin@fixitnow.com",
            password: adminPassword,
            phone: "+8801700000000",
            role: Role.ADMIN,
        },
    });

    // ── Technicians ────────────────────────────────────────────────────
    const rafiq = await prisma.user.create({
        data: {
            name: "Rafiqul Islam",
            email: "rafiqul@fixitnow.com",
            password,
            phone: "+8801711111111",
            role: Role.TECHNICIAN,
            technicianProfile: {
                create: {
                    bio: "Licensed plumber with a decade of residential experience.",
                    skills: ["Pipe fitting", "Leak detection", "Water heater installation"],
                    experienceYears: 10,
                    hourlyRate: 45,
                    location: "Dhanmondi, Dhaka",
                },
            },
        },
        include: { technicianProfile: true },
    });

    const shirin = await prisma.user.create({
        data: {
            name: "Shirin Akter",
            email: "shirin@fixitnow.com",
            password,
            phone: "+8801722222222",
            role: Role.TECHNICIAN,
            technicianProfile: {
                create: {
                    bio: "Electrician specialising in home rewiring and safety audits.",
                    skills: ["Wiring", "Circuit breakers", "Lighting"],
                    experienceYears: 7,
                    hourlyRate: 55,
                    location: "Gulshan, Dhaka",
                },
            },
        },
        include: { technicianProfile: true },
    });

    const tanvir = await prisma.user.create({
        data: {
            name: "Tanvir Hasan",
            email: "tanvir@fixitnow.com",
            password,
            phone: "+8801733333333",
            role: Role.TECHNICIAN,
            technicianProfile: {
                create: {
                    bio: "Appliance technician covering AC, refrigeration and laundry machines.",
                    skills: ["AC servicing", "Refrigeration", "Washing machines"],
                    experienceYears: 5,
                    hourlyRate: 40,
                    location: "Uttara, Dhaka",
                },
            },
        },
        include: { technicianProfile: true },
    });

    const rafiqProfile = rafiq.technicianProfile!;
    const shirinProfile = shirin.technicianProfile!;
    const tanvirProfile = tanvir.technicianProfile!;

    console.log("🛠️  Created 3 technicians with profiles.");

    // ── Availability ───────────────────────────────────────────────────
    await prisma.availabilitySlot.createMany({
        data: [
            { technicianId: rafiqProfile.id, weekday: Weekday.SUNDAY, startTime: "09:00", endTime: "17:00" },
            { technicianId: rafiqProfile.id, weekday: Weekday.MONDAY, startTime: "09:00", endTime: "17:00" },
            { technicianId: rafiqProfile.id, weekday: Weekday.TUESDAY, startTime: "09:00", endTime: "13:00" },
            { technicianId: shirinProfile.id, weekday: Weekday.MONDAY, startTime: "10:00", endTime: "18:00" },
            { technicianId: shirinProfile.id, weekday: Weekday.WEDNESDAY, startTime: "10:00", endTime: "18:00" },
            { technicianId: tanvirProfile.id, weekday: Weekday.THURSDAY, startTime: "08:00", endTime: "16:00" },
            { technicianId: tanvirProfile.id, weekday: Weekday.FRIDAY, startTime: "14:00", endTime: "20:00" },
        ],
    });

    // ── Services ───────────────────────────────────────────────────────
    const leakRepair = await prisma.service.create({
        data: {
            title: "Emergency leak repair",
            description: "Same-day repair for burst pipes and persistent leaks.",
            price: 120,
            categoryId: plumbing.id,
            technicianId: rafiqProfile.id,
        },
    });
    const drainCleaning = await prisma.service.create({
        data: {
            title: "Drain unclogging",
            description: "Clears kitchen and bathroom drains, includes inspection.",
            price: 80,
            categoryId: plumbing.id,
            technicianId: rafiqProfile.id,
        },
    });
    const rewiring = await prisma.service.create({
        data: {
            title: "Full home rewiring",
            description: "Replaces ageing wiring and upgrades the distribution board.",
            price: 450,
            categoryId: electrical.id,
            technicianId: shirinProfile.id,
        },
    });
    const lightInstall = await prisma.service.create({
        data: {
            title: "Light fixture installation",
            description: "Mounts ceiling lights, fans and wall fixtures.",
            price: 95,
            categoryId: electrical.id,
            technicianId: shirinProfile.id,
        },
    });
    const acService = await prisma.service.create({
        data: {
            title: "AC servicing and gas refill",
            description: "Full clean, filter change and refrigerant top-up.",
            price: 140,
            categoryId: appliance.id,
            technicianId: tanvirProfile.id,
        },
    });
    const deepClean = await prisma.service.create({
        data: {
            title: "Deep cleaning (2 bedroom)",
            description: "Whole-flat clean including kitchen and bathrooms.",
            price: 160,
            categoryId: cleaning.id,
            technicianId: tanvirProfile.id,
        },
    });

    console.log("🧰 Created 6 services.");

    // ── Customers ──────────────────────────────────────────────────────
    const nusrat = await prisma.user.create({
        data: {
            name: "Nusrat Jahan",
            email: "nusrat@example.com",
            password,
            phone: "+8801744444444",
            role: Role.CUSTOMER,
        },
    });
    const imran = await prisma.user.create({
        data: {
            name: "Imran Kabir",
            email: "imran@example.com",
            password,
            phone: "+8801755555555",
            role: Role.CUSTOMER,
        },
    });
    const farhana = await prisma.user.create({
        data: {
            name: "Farhana Rahman",
            email: "farhana@example.com",
            password,
            phone: "+8801766666666",
            role: Role.CUSTOMER,
        },
    });

    console.log("👥 Created 3 customers.");

    // ── Bookings across the lifecycle ──────────────────────────────────
    const completedBooking = await prisma.booking.create({
        data: {
            customerId: nusrat.id,
            technicianId: rafiqProfile.id,
            serviceId: leakRepair.id,
            scheduledAt: daysFromNow(-7, 10),
            address: "House 24, Road 7, Dhanmondi, Dhaka",
            notes: "Kitchen sink pipe was leaking under the cabinet.",
            totalPrice: leakRepair.price,
            status: BookingStatus.COMPLETED,
            payment: {
                create: {
                    amount: leakRepair.price,
                    status: PaymentStatus.COMPLETED,
                    paymentMethod: "card",
                    transactionId: "cs_test_seed_completed_001",
                    paidAt: daysFromNow(-7, 9),
                },
            },
        },
    });

    const paidBooking = await prisma.booking.create({
        data: {
            customerId: imran.id,
            technicianId: shirinProfile.id,
            serviceId: lightInstall.id,
            scheduledAt: daysFromNow(2, 11),
            address: "Flat 5B, Road 11, Banani, Dhaka",
            totalPrice: lightInstall.price,
            status: BookingStatus.PAID,
            payment: {
                create: {
                    amount: lightInstall.price,
                    status: PaymentStatus.COMPLETED,
                    paymentMethod: "card",
                    transactionId: "cs_test_seed_paid_002",
                    paidAt: daysFromNow(-1, 15),
                },
            },
        },
    });

    await prisma.booking.create({
        data: {
            customerId: farhana.id,
            technicianId: tanvirProfile.id,
            serviceId: acService.id,
            scheduledAt: daysFromNow(4, 9),
            address: "House 12, Sector 4, Uttara, Dhaka",
            notes: "Two split units, both cooling poorly.",
            totalPrice: acService.price,
            status: BookingStatus.ACCEPTED,
        },
    });

    await prisma.booking.create({
        data: {
            customerId: nusrat.id,
            technicianId: shirinProfile.id,
            serviceId: rewiring.id,
            scheduledAt: daysFromNow(9, 10),
            address: "House 24, Road 7, Dhanmondi, Dhaka",
            totalPrice: rewiring.price,
            status: BookingStatus.REQUESTED,
        },
    });

    await prisma.booking.create({
        data: {
            customerId: imran.id,
            technicianId: rafiqProfile.id,
            serviceId: drainCleaning.id,
            scheduledAt: daysFromNow(-3, 14),
            address: "Flat 5B, Road 11, Banani, Dhaka",
            totalPrice: drainCleaning.price,
            status: BookingStatus.CANCELLED,
        },
    });

    await prisma.booking.create({
        data: {
            customerId: farhana.id,
            technicianId: tanvirProfile.id,
            serviceId: deepClean.id,
            scheduledAt: daysFromNow(-1, 12),
            address: "House 12, Sector 4, Uttara, Dhaka",
            totalPrice: deepClean.price,
            status: BookingStatus.IN_PROGRESS,
            payment: {
                create: {
                    amount: deepClean.price,
                    status: PaymentStatus.COMPLETED,
                    paymentMethod: "card",
                    transactionId: "cs_test_seed_inprogress_003",
                    paidAt: daysFromNow(-2, 12),
                },
            },
        },
    });

    console.log("📋 Created 6 bookings across the lifecycle.");

    // ── Review on the completed job ────────────────────────────────────
    await prisma.review.create({
        data: {
            bookingId: completedBooking.id,
            customerId: nusrat.id,
            technicianId: rafiqProfile.id,
            rating: 5,
            comment: "Arrived within the hour and fixed the leak properly. Highly recommended.",
        },
    });

    await prisma.technicianProfile.update({
        where: { id: rafiqProfile.id },
        data: { rating: 5, reviewCount: 1 },
    });

    console.log("⭐ Created 1 review.");

    console.log(`
✅ Seed complete.

   Admin       ${admin.email} / ${ADMIN_PASSWORD}
   Technician  ${rafiq.email} / ${DEMO_PASSWORD}
   Customer    ${nusrat.email} / ${DEMO_PASSWORD}

   PAID booking the technician can start: ${paidBooking.id}
`);
}

main()
    .catch((error) => {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
