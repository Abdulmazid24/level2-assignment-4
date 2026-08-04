import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";
import { BookingStatus, PaymentStatus, Role } from "./generated/prisma/enums";

async function main() {
    // Clean up existing data (order matters due to foreign keys)
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.car.deleteMany();
    await prisma.user.deleteMany();

    console.log("🗑️  Cleared existing data.");

    const password = await bcrypt.hash("Password@123", 10);

    // ── Users ──────────────────────────────────────────────────────────
    const [owner1, owner2, renter1, renter2, renter3, renter4, admin] =
        await Promise.all([
            prisma.user.create({
                data: {
                    name: "James Whitfield",
                    email: "james.whitfield@rentals.com",
                    password,
                    role: Role.OWNER,
                },
            }),
            prisma.user.create({
                data: {
                    name: "Sarah Mitchell",
                    email: "sarah.mitchell@rentals.com",
                    password,
                    role: Role.OWNER,
                },
            }),
            prisma.user.create({
                data: {
                    name: "Daniel Carter",
                    email: "daniel.carter@mail.com",
                    password,
                    role: Role.RENTER,
                },
            }),
            prisma.user.create({
                data: {
                    name: "Olivia Thompson",
                    email: "olivia.thompson@mail.com",
                    password,
                    role: Role.RENTER,
                },
            }),
            prisma.user.create({
                data: {
                    name: "Marcus Johnson",
                    email: "marcus.johnson@mail.com",
                    password,
                    role: Role.RENTER,
                },
            }),
            prisma.user.create({
                data: {
                    name: "Emily Rodriguez",
                    email: "emily.rodriguez@mail.com",
                    password,
                    role: Role.RENTER,
                },
            }),
            prisma.user.create({
                data: {
                    name: "Nathan Brooks",
                    email: "nathan.brooks@admin.com",
                    password,
                    role: Role.ADMIN,
                },
            }),
        ]);

    console.log("✅ Created 7 users.");

    // ── Cars ───────────────────────────────────────────────────────────
    const cars = await Promise.all([
        prisma.car.create({
            data: {
                brand: "Toyota",
                model: "Camry",
                dailyRate: 55.0,
                location: "New York, NY",
                ownerId: owner1.id,
            },
        }),
        prisma.car.create({
            data: {
                brand: "Honda",
                model: "Accord",
                dailyRate: 60.0,
                location: "Los Angeles, CA",
                ownerId: owner1.id,
            },
        }),
        prisma.car.create({
            data: {
                brand: "Ford",
                model: "Mustang GT",
                dailyRate: 110.0,
                location: "Chicago, IL",
                ownerId: owner1.id,
            },
        }),
        prisma.car.create({
            data: {
                brand: "BMW",
                model: "3 Series",
                dailyRate: 130.0,
                location: "Miami, FL",
                ownerId: owner2.id,
            },
        }),
        prisma.car.create({
            data: {
                brand: "Tesla",
                model: "Model 3",
                dailyRate: 160.0,
                location: "San Francisco, CA",
                ownerId: owner2.id,
            },
        }),
        prisma.car.create({
            data: {
                brand: "Mercedes-Benz",
                model: "C-Class",
                dailyRate: 140.0,
                location: "Boston, MA",
                ownerId: owner2.id,
            },
        }),
        prisma.car.create({
            data: {
                brand: "Audi",
                model: "A4",
                dailyRate: 115.0,
                location: "Seattle, WA",
                ownerId: owner1.id,
            },
        }),
    ]);

    console.log(`✅ Created ${cars.length} cars.`);

    // ── Bookings ───────────────────────────────────────────────────────
    const booking1 = await prisma.booking.create({
        data: {
            carId: cars[0]!.id,
            renterId: renter1.id,
            startDate: new Date("2026-05-01"),
            endDate: new Date("2026-05-04"),
            totalPrice: 3 * cars[0]!.dailyRate,
            status: BookingStatus.CONFIRMED,
        },
    });

    const booking2 = await prisma.booking.create({
        data: {
            carId: cars[1]!.id,
            renterId: renter2.id,
            startDate: new Date("2026-05-10"),
            endDate: new Date("2026-05-15"),
            totalPrice: 5 * cars[1]!.dailyRate,
            status: BookingStatus.CONFIRMED,
        },
    });

    const booking3 = await prisma.booking.create({
        data: {
            carId: cars[2]!.id,
            renterId: renter3.id,
            startDate: new Date("2026-06-01"),
            endDate: new Date("2026-06-03"),
            totalPrice: 2 * cars[2]!.dailyRate,
            status: BookingStatus.PENDING,
        },
    });

    const booking4 = await prisma.booking.create({
        data: {
            carId: cars[3]!.id,
            renterId: renter4.id,
            startDate: new Date("2026-06-15"),
            endDate: new Date("2026-06-20"),
            totalPrice: 5 * cars[3]!.dailyRate,
            status: BookingStatus.CONFIRMED,
        },
    });

    const booking5 = await prisma.booking.create({
        data: {
            carId: cars[4]!.id,
            renterId: renter1.id,
            startDate: new Date("2026-07-01"),
            endDate: new Date("2026-07-07"),
            totalPrice: 6 * cars[4]!.dailyRate,
            status: BookingStatus.CANCELLED,
        },
    });

    const booking6 = await prisma.booking.create({
        data: {
            carId: cars[5]!.id,
            renterId: renter2.id,
            startDate: new Date("2026-08-10"),
            endDate: new Date("2026-08-14"),
            totalPrice: 4 * cars[5]!.dailyRate,
            status: BookingStatus.PENDING,
        },
    });

    console.log("✅ Created 6 bookings.");

    // ── Payments ───────────────────────────────────────────────────────
    await Promise.all([
        prisma.payment.create({
            data: {
                bookingId: booking1.id,
                amount: booking1.totalPrice,
                status: PaymentStatus.COMPLETED,
                paymentMethod: "credit_card",
                transactionId: "txn_stripe_4f9a2c1b",
                paidAt: new Date("2026-05-01"),
            },
        }),
        prisma.payment.create({
            data: {
                bookingId: booking2.id,
                amount: booking2.totalPrice,
                status: PaymentStatus.COMPLETED,
                paymentMethod: "paypal",
                transactionId: "txn_paypal_7d3e8b2a",
                paidAt: new Date("2026-05-10"),
            },
        }),
        prisma.payment.create({
            data: {
                bookingId: booking3.id,
                amount: booking3.totalPrice,
                status: PaymentStatus.PENDING,
                paymentMethod: "stripe",
            },
        }),
        prisma.payment.create({
            data: {
                bookingId: booking4.id,
                amount: booking4.totalPrice,
                status: PaymentStatus.COMPLETED,
                paymentMethod: "credit_card",
                transactionId: "txn_stripe_9c1d5e7f",
                paidAt: new Date("2026-06-15"),
            },
        }),
        prisma.payment.create({
            data: {
                bookingId: booking6.id,
                amount: booking6.totalPrice,
                status: PaymentStatus.PENDING,
                paymentMethod: "bank_transfer",
            },
        }),
    ]);

    console.log("✅ Created 5 payments.");
    console.log("🌱 Database seeded successfully!");
}

main()
    .catch((err) => {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });