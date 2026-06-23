using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public class AppDbContext : DbContext
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<User> Users => Set<User>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
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

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);

            entity.HasData(
                new AdminUser { Id = 1, FirstName = "Michael", LastName = "Garcia", Email = "michael@example.com", PhoneNumber = "+1-555-0101", IsActive = true },
                new AdminUser { Id = 2, FirstName = "Sarah", LastName = "Johnson", Email = "sarah@example.com", PhoneNumber = "+1-555-0102", IsActive = true },
                new AdminUser { Id = 3, FirstName = "James", LastName = "Wilson", Email = "james@example.com", PhoneNumber = "+1-555-0103", IsActive = false }
            );
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Total).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Shipping).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasColumnType("timestamp with time zone");
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
