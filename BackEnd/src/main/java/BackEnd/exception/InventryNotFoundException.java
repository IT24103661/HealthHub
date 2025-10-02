package BackEnd.exception;

public class InventryNotFoundException extends RuntimeException {
    public InventryNotFoundException(Long id) {
        super("could not find inventry with id " + id);
    }
    public InventryNotFoundException(String message) {
        super(message);
    }
}
