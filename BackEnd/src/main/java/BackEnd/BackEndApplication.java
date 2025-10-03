package BackEnd;

import BackEnd.model.User;
import BackEnd.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackEndApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackEndApplication.class, args);
	}

	@Bean
	CommandLineRunner seedAdmin(UserRepository userRepository) {
		return args -> {
			userRepository.findByEmail("admin@example.com").ifPresentOrElse(
				u -> {},
				() -> {
					User admin = new User();
					admin.setFullName("Administrator");
					admin.setEmail("admin@example.com");
					admin.setPassword("admin123"); // In production, hash this
					admin.setRole("admin");
					admin.setStatus("active");
					userRepository.save(admin);
				}
			);
		};
	}
}
