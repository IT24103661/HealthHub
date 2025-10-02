package BackEnd.controller;

import BackEnd.exception.InventryNotFoundException;
import BackEnd.model.InventryModel;
import BackEnd.repository.InventryRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/inventry")
public class InventryController {

    @Autowired
    private InventryRepository inventryRepository;

    private static final String UPLOAD_DIR = "src/main/uploads/";

    @PostMapping
    public InventryModel createInventry(@Valid @RequestBody InventryModel newInventryModel) {
        return inventryRepository.save(newInventryModel);
    }

    @GetMapping
    public List<InventryModel> getAllInventry() {
        return inventryRepository.findAll();
    }

    @GetMapping("/{id}")
    public InventryModel getInventryById(@PathVariable Long id) {
        return inventryRepository.findById(id)
                .orElseThrow(() -> new InventryNotFoundException(id));
    }

    @PutMapping("/{id}")
    public InventryModel updateInventry(@PathVariable Long id, @Valid @RequestBody InventryModel updatedInventry) {
        return inventryRepository.findById(id)
                .map(inventry -> {
                    inventry.setItemid(updatedInventry.getItemid());
                    inventry.setItemName(updatedInventry.getItemName());
                    inventry.setItemImage(updatedInventry.getItemImage());
                    inventry.setItemQty(updatedInventry.getItemQty());
                    inventry.setItemCategory(updatedInventry.getItemCategory());
                    inventry.setItemDetails(updatedInventry.getItemDetails());
                    return inventryRepository.save(inventry);
                })
                .orElseThrow(() -> new InventryNotFoundException(id));
    }

    @DeleteMapping("/{id}")
    public String deleteInventry(@PathVariable Long id) {
        if (!inventryRepository.existsById(id)) {
            throw new InventryNotFoundException(id);
        }
        inventryRepository.deleteById(id);
        return "Inventory item with id " + id + " has been deleted successfully";
    }

    @PostMapping("/itemImg")
    public String uploadItemImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return "error: empty file";

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            file.transferTo(filePath);

            return filename;
        } catch (IOException e) {
            e.printStackTrace();
            return "error";
        }
    }

    @GetMapping("/itemImg/{filename:.+}")
    public ResponseEntity<Resource> getItemImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                throw new InventryNotFoundException("File not found: " + filename);
            }
        } catch (IOException e) {
            throw new InventryNotFoundException("File not found: " + filename);
        }
    }
}