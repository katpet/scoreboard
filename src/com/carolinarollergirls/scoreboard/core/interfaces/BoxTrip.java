package com.carolinarollergirls.scoreboard.core.interfaces;

import java.util.ArrayList;
import java.util.Collection;

import com.carolinarollergirls.scoreboard.event.Child;
import com.carolinarollergirls.scoreboard.event.Command;
import com.carolinarollergirls.scoreboard.event.Property;
import com.carolinarollergirls.scoreboard.event.ScoreBoardEventProvider;
import com.carolinarollergirls.scoreboard.event.Value;

public interface BoxTrip extends ScoreBoardEventProvider {
    public int compareTo(BoxTrip other);

    public void end();
    public void unend();
    public void restart();

    public Team getTeam();

    public boolean isCurrent();
    public Fielding getCurrentFielding();
    public Fielding getStartFielding();
    public boolean startedBetweenJams();
    public boolean startedAfterSP();
    public Fielding getEndFielding();
    public boolean endedBetweenJams();
    public boolean endedAfterSP();
    public int getPeriodNumber();
    public int getPenaltyCount();
    public void setPenaltyCount(int count);

    public static Collection<Property<?>> props = new ArrayList<>();

    public static final Value<Boolean> IS_CURRENT = new Value<>(Boolean.class, "IsCurrent", false, props);
    public static final Value<Fielding> CURRENT_FIELDING = new Value<>(Fielding.class, "CurrentFielding", null, props);
    public static final Value<Fielding> START_FIELDING = new Value<>(Fielding.class, "StartFielding", null, props);
    public static final Value<Integer> START_JAM_NUMBER = new Value<>(Integer.class, "StartJamNumber", 0, props);
    public static final Value<Boolean> START_BETWEEN_JAMS =
        new Value<>(Boolean.class, "StartBetweenJams", false, props);
    public static final Value<Boolean> START_AFTER_S_P = new Value<>(Boolean.class, "StartAfterSP", false, props);
    public static final Value<Fielding> END_FIELDING = new Value<>(Fielding.class, "EndFielding", null, props);
    public static final Value<Integer> END_JAM_NUMBER = new Value<>(Integer.class, "EndJamNumber", 0, props);
    public static final Value<Boolean> END_BETWEEN_JAMS = new Value<>(Boolean.class, "EndBetweenJams", false, props);
    public static final Value<Boolean> END_AFTER_S_P = new Value<>(Boolean.class, "EndAfterSP", false, props);
    public static final Value<Long> WALLTIME_START = new Value<>(Long.class, "WalltimeStart", 0L, props);
    public static final Value<Long> WALLTIME_END = new Value<>(Long.class, "WalltimeEnd", 0L, props);
    public static final Value<Long> JAM_CLOCK_START = new Value<>(Long.class, "JamClockStart", 0L, props);
    public static final Value<Long> JAM_CLOCK_END = new Value<>(Long.class, "JamClockEnd", 0L, props);
    public static final Value<Long> DURATION = new Value<>(Long.class, "Duration", 0L, props);
    public static final Value<Integer> PERIOD_NUMBER = new Value<>(Integer.class, "PeriodNumber", 1, props);
    public static final Value<Integer> PENALTY_COUNT = new Value<>(Integer.class, "PenaltyCount", 1, props);

    public static final Child<Fielding> FIELDING = new Child<>(Fielding.class, "Fielding", props);
    public static final Child<Penalty> PENALTY = new Child<>(Penalty.class, "Penalty", props);

    public static final Command START_EARLIER = new Command("StartEarlier", props);
    public static final Command START_LATER = new Command("StartLater", props);
    public static final Command END_EARLIER = new Command("EndEarlier", props);
    public static final Command END_LATER = new Command("EndLater", props);
    public static final Command DELETE = new Command("Delete", props);
}
