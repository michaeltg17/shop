using Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public class AppDbContext : IdentityDbContext<IdentityUser>
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Category).HasMaxLength(100).HasDefaultValue("");
            entity.Property(e => e.Image).HasMaxLength(500).HasDefaultValue("");
            entity.HasIndex(e => e.Category);

            entity.OwnsOne(e => e.Rating, rating =>
            {
                rating.Property(r => r.Rate).HasColumnName("RatingRate");
                rating.Property(r => r.Count).HasColumnName("RatingCount");
            });

            entity.HasData(
                new Product { Id = 1, Name = "Laptop", Description = "High-performance laptop", Price = 999.99m, Category = "Electronics", Image = "https://placehold.co/400x300/3b82f6/white?text=Laptop" },
                new Product { Id = 2, Name = "Mouse", Description = "Wireless ergonomic mouse", Price = 29.99m, Category = "Electronics", Image = "https://placehold.co/400x300/ef4444/white?text=Mouse" },
                new Product { Id = 3, Name = "Keyboard", Description = "Mechanical keyboard", Price = 79.99m, Category = "Electronics", Image = "https://placehold.co/400x300/22c55e/white?text=Keyboard" }
            );
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Total).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Shipping).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasColumnType("timestamp with time zone");
            entity.Property(e => e.ShippingName).HasMaxLength(100).HasDefaultValue("");
            entity.Property(e => e.ShippingAddressLine1).HasMaxLength(255).HasDefaultValue("");
            entity.Property(e => e.ShippingAddressLine2).HasMaxLength(255).HasDefaultValue("");
            entity.Property(e => e.ShippingCity).HasMaxLength(100).HasDefaultValue("");
            entity.Property(e => e.ShippingState).HasMaxLength(100).HasDefaultValue("");
            entity.Property(e => e.ShippingZip).HasMaxLength(20).HasDefaultValue("");
            entity.Property(e => e.ShippingCountry).HasMaxLength(100).HasDefaultValue("");
            entity.HasMany(e => e.Items).WithOne(i => i.Order!).HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ProductId).IsRequired();
            entity.Property(e => e.ProductName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Quantity).IsRequired();
        });
    }
}
