package BackEnd.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
public class InventryModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Item ID is required")
    private String itemid;
    
    @NotBlank(message = "Item name is required")
    private String itemName;
    
    private String itemImage;
    
    @NotNull(message = "Item quantity is required")
    private String itemQty;
    
    @NotBlank(message = "Item category is required")
    private String itemCategory;
    
    private String itemDetails;

    public InventryModel() {}

    public InventryModel(String itemid, String itemName, String itemImage, String itemQty, String itemCategory, String itemDetails) {
        this.itemid = itemid;
        this.itemName = itemName;
        this.itemImage = itemImage;
        this.itemQty = itemQty;
        this.itemCategory = itemCategory;
        this.itemDetails = itemDetails;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getItemid() { return itemid; }
    public void setItemid(String itemid) { this.itemid = itemid; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public String getItemImage() { return itemImage; }
    public void setItemImage(String itemImage) { this.itemImage = itemImage; }
    public String getItemQty() { return itemQty; }
    public void setItemQty(String itemQty) { this.itemQty = itemQty; }
    public String getItemCategory() { return itemCategory; }
    public void setItemCategory(String itemCategory) { this.itemCategory = itemCategory; }
    public String getItemDetails() { return itemDetails; }
    public void setItemDetails(String itemDetails) { this.itemDetails = itemDetails; }
}