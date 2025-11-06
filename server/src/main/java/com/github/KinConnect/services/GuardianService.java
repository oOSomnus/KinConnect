package com.github.KinConnect.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GuardianService {
    private final UserRepository userRepository;

    @Transactional
    public void addOld(Long guardianId, Long oldId, String oldEmail) {
        if (guardianId == null) {
            throw new AppException(400, "Invalid guardian id in token", "Invalid guardian id in token");
        }
        if ((oldId == null && (oldEmail == null || oldEmail.isBlank()))
                || (oldId != null && oldEmail != null && !oldEmail.isBlank())) {
            throw new AppException(400, "Exactly one of oldId or oldEmail must be provided",
                    "Exactly one of oldId or oldEmail must be provided");
        }

        User guardian = userRepository.findById(guardianId)
                .orElseThrow(() -> new AppException(404, "Guardian not found", "Guardian not found"));

        if (Boolean.TRUE.equals(guardian.getIsOld())) {
            throw new AppException(400, "Current user is not a guardian", "Current user is not a guardian");
        }

        User old = (oldId != null)
                ? userRepository.findById(oldId).orElse(null)
                : userRepository.findByEmail(oldEmail);

        if (old == null) throw new AppException(404, "Old user not found", "Old user not found");

        if (!Boolean.TRUE.equals(old.getIsOld())) {
            throw new AppException(400, "Target user is not an old account", "Target user must be an old account");
        }
        if (guardian.getId().equals(old.getId())) {
            throw new AppException(400, "Cannot bind yourself as an old", "Cannot bind yourself as an old");
        }

        if (old.getGuardian() != null) {
            if (guardian.getId().equals(old.getGuardian().getId())) {
                throw new AppException(409, "Binding already exists", "Binding already exists");
            } else {
                throw new AppException(409, "Old already bound to another guardian",
                        "Old already bound to another guardian");
            }
        }

        old.setGuardian(guardian);
        if (guardian.getOlds() == null) guardian.setOlds(new ArrayList<>());
        guardian.getOlds().add(old);

        userRepository.save(old);      // owning side is usually enough
        userRepository.save(guardian); // keep if you need both sides updated explicitly
    }
}
